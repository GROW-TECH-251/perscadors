import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile } from 'fs/promises';

// IMPL-3 (décision C3, consolidation 09/2026) — prix forfaitaire HP Look :
// - 2 modes mutuellement exclusifs : 'calculated' (somme des pièces via
//   trigger) et 'flat' (forfait manuel = RÉFÉRENCE) ;
// - le service envoie pricing_mode + custom_price cohérents ;
// - résilience sans ordre de déploiement : colonne absente (42703, migration
//   non exécutée) -> mode calculé = repli historique silencieux (retry sans
//   la colonne) ; mode forfait = erreur explicite, JAMAIS de perte silencieuse ;
// - l'admin HPB propose le sélecteur 2 modes avec avertissement avant
//   bascule (les deux sens ont une conséquence) et valide le forfait (> 0) ;
// - le badge de liste « Forfait » remplace l'ancien « Prix Spécial Look »
//   (custom_price est désormais toujours rempli par le trigger).

const mocks = vi.hoisted(() => ({
  supabase: {
    from: vi.fn(),
  },
}));

vi.mock('@/lib/supabase', () => ({
  supabase: mocks.supabase,
  isSupabaseConfigured: true,
  requireSupabase: () => mocks.supabase,
}));

vi.mock('@/lib/supabaseErrors', () => ({
  logSupabaseWarning: vi.fn(),
}));

const MISSING_COLUMN_ERROR = {
  code: '42703',
  message: 'column "pricing_mode" of relation "outfits" does not exist'
};

describe('Unit — IMPL-3 : service outfits (forfait C3)', () => {
  let insert: ReturnType<typeof vi.fn>;
  let update: ReturnType<typeof vi.fn>;
  let single: ReturnType<typeof vi.fn>;
  let results: Array<{ data: unknown; error: unknown }>;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    results = [];
    single = vi.fn(async () => results.shift() ?? { data: null, error: null });
    insert = vi.fn(() => ({ select: () => ({ single }) }));
    update = vi.fn(() => ({ eq: () => ({ select: () => ({ single }) }) }));
    mocks.supabase.from.mockReturnValue({ insert, update });
  });

  it('createOutfit envoie pricing_mode et le forfait comme custom_price', async () => {
    results.push({ data: { id: 1, pricing_mode: 'flat' }, error: null });
    const { createOutfit } = await import('@/services/outfitService');
    const result = await createOutfit({
      name: 'Look Forfait',
      image_url: '/look.jpg',
      custom_price: 15000,
      pricing_mode: 'flat',
      product_ids: [101, 202],
      visible: true
    });

    expect(insert).toHaveBeenCalledTimes(1);
    const row = insert.mock.calls[0][0][0] as Record<string, unknown>;
    expect(row.pricing_mode).toBe('flat');
    expect(row.custom_price).toBe(15000);
    expect(result.data?.id).toBe(1);
    expect(result.error).toBeNull();
  });

  it('createOutfit en mode calculé : pricing_mode calculated + custom_price null (somme trigger)', async () => {
    results.push({ data: { id: 2 }, error: null });
    const { createOutfit } = await import('@/services/outfitService');
    await createOutfit({
      name: 'Look Calculé',
      image_url: '/look.jpg',
      product_ids: [101],
      visible: true
    });

    const row = insert.mock.calls[0][0][0] as Record<string, unknown>;
    expect(row.pricing_mode).toBe('calculated');
    expect(row.custom_price).toBeNull();
  });

  it('colonne absente (42703) + mode calculé : retry sans pricing_mode, comportement historique', async () => {
    results.push({ data: null, error: MISSING_COLUMN_ERROR });
    results.push({ data: { id: 3 }, error: null });
    const { createOutfit } = await import('@/services/outfitService');
    const result = await createOutfit({
      name: 'Look Legacy',
      image_url: '/look.jpg',
      product_ids: [101],
      visible: true,
      pricing_mode: 'calculated'
    });

    expect(insert).toHaveBeenCalledTimes(2);
    const legacyRow = insert.mock.calls[1][0][0] as Record<string, unknown>;
    expect(legacyRow.pricing_mode).toBeUndefined();
    expect(result.data?.id).toBe(3);
    expect(result.error).toBeNull();
  });

  it('colonne absente (42703) + forfait : erreur explicite, pas de perte silencieuse', async () => {
    results.push({ data: null, error: MISSING_COLUMN_ERROR });
    const { createOutfit } = await import('@/services/outfitService');
    const result = await createOutfit({
      name: 'Look Forfait Impossible',
      image_url: '/look.jpg',
      custom_price: 15000,
      pricing_mode: 'flat',
      product_ids: [],
      visible: true
    });

    expect(insert).toHaveBeenCalledTimes(1);
    expect(result.data).toBeNull();
    expect(result.error).toContain('add_outfit_pricing_mode.sql');
  });

  it('updateOutfit transmet pricing_mode (bascule de mode gérée par le trigger v2)', async () => {
    results.push({ data: { id: 7, pricing_mode: 'flat' }, error: null });
    const { updateOutfit } = await import('@/services/outfitService');
    await updateOutfit(7, { pricing_mode: 'flat', custom_price: 12000 });

    expect(update).toHaveBeenCalledTimes(1);
    const payload = update.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.pricing_mode).toBe('flat');
    expect(payload.custom_price).toBe(12000);
  });

  it('updateOutfit : repli 42703 en mode calculé (retry sans la colonne)', async () => {
    results.push({ data: null, error: MISSING_COLUMN_ERROR });
    results.push({ data: { id: 8 }, error: null });
    const { updateOutfit } = await import('@/services/outfitService');
    const result = await updateOutfit(8, { visible: false, pricing_mode: 'calculated' });

    expect(update).toHaveBeenCalledTimes(2);
    const legacyPayload = update.mock.calls[1][0] as Record<string, unknown>;
    expect(legacyPayload.pricing_mode).toBeUndefined();
    expect(legacyPayload.visible).toBe(false);
    expect(result.data?.id).toBe(8);
  });
});

describe('Unit — IMPL-3 : gardes anti-dérive (sources)', () => {
  it('la migration : garde prérequis, colonne, contrainte flat exige un prix, trigger v2 conditionnel, rollback', async () => {
    const sql = await readFile('supabase/migrations/add_outfit_pricing_mode.sql', 'utf-8');
    expect(sql).toContain("to_regclass('public.outfits')");
    expect(sql).toContain('PRÉREQUIS ABSENT');
    expect(sql).toContain("add column if not exists pricing_mode text not null default 'calculated'");
    expect(sql).toContain("pricing_mode in ('calculated', 'flat')");
    // le forfait exige un prix au niveau base
    expect(sql).toContain("pricing_mode = 'calculated' or custom_price is not null");
    // trigger v2 : recalcul UNIQUEMENT en mode calculé + étendu aux bascules
    expect(sql).toContain('if new.pricing_mode = ' + "'calculated' then");
    expect(sql).toContain('before insert or update of product_ids, pricing_mode');
    // rollback documenté avant exécution
    expect(sql.indexOf('Rollback')).toBeLessThan(sql.indexOf('begin;'));
    expect(sql).toContain('drop column if exists pricing_mode');
  });

  it("l'admin HPB : 2 modes mutuellement exclusifs + avertissement avant bascule + validation du forfait", async () => {
    const page = await readFile('src/app/admin/hpb/page.tsx', 'utf-8');
    expect(page).toContain("pricingMode === 'calculated'");
    expect(page).toContain("pricingMode === 'flat'");
    expect(page).toContain('Calculé (somme)');
    expect(page).toContain('Forfait (manuel)');
    expect(page).toContain('window.confirm');
    expect(page).toContain('Passer au prix forfaitaire ?');
    expect(page).toContain('Revenir au prix calculé ?');
    expect(page).toContain('Prix forfaitaire invalide : indique un nombre supérieur à 0.');
    // le payload dépend du mode — plus de custom_price:null forcé
    expect(page).not.toContain('custom_price: null, // Le trigger');
    expect(page).toContain("custom_price: pricingMode === 'flat' ? Number(flatPrice) : null");
  });

  it("l'admin HPB : badge « Forfait » (remplace « Prix Spécial Look », vide de sens depuis que le trigger remplit custom_price)", async () => {
    const page = await readFile('src/app/admin/hpb/page.tsx', 'utf-8');
    expect(page).toContain("outfit.pricing_mode === 'flat'");
    expect(page).not.toContain('Prix Spécial Look');
  });

  it('types : AdminOutfit et OutfitFormData exposent pricing_mode optionnel', async () => {
    const types = await readFile('src/admin/types.ts', 'utf-8');
    expect(types).toContain("pricing_mode?: 'calculated' | 'flat';");
    expect(types.match(/pricing_mode\?: 'calculated' \| 'flat';/g)?.length).toBe(2);
  });

  it('la lecture publique reste inchangée : custom_price ?? somme (le forfait passe déjà)', async () => {
    const svc = await readFile('src/services/publicCatalogService.ts', 'utf-8');
    expect(svc).toContain('outfitRow.custom_price !== null && outfitRow.custom_price !== undefined');
  });
});
