import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile } from 'fs/promises';

// IMPL-4 (décisions C3+C4, consolidation 09/2026) — décomposition du forfait :
// - lignes libres « libellé + montant » sous le forfait, JAMAIS de faux
//   articles catalogue (aucune interaction avec products) ;
// - affichage public CONFIGURABLE par look (show_price_breakdown) et réservé
//   au mode forfait ;
// - le forfait reste la référence : la somme des lignes est indicative ;
// - modifier la décomposition ne doit JAMAIS retoucher au prix (le trigger
//   IMPL-3 n'est pas étendu — la migration IMPL-4 ne le touche pas) ;
// - résilience pré-migration (42703) : repli historique en calculé, message
//   explicite pour le forfait.

const mocks = vi.hoisted(() => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
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

const VISIBLE_PRODUCT = {
  id: 101,
  name: 'Basket Vision',
  category: 'basket-pour-homme',
  price: 10000,
  image_url: '/basket.jpg',
  images: ['/basket.jpg'],
  sizes: ['41'],
  colors: [],
  outOfStockSizes: [],
  outOfStockColors: [],
  demand: 5,
  stock: 4,
  badge: null,
  description: 'Basket premium.',
  visible: true,
  slug: 'basket-vision',
  isPopular: false,
  video_url: null,
  video_public_id: null,
  created_at: '2026-01-01',
  updated_at: '2026-01-01'
};

const BREAKDOWN = [
  { label: 'Veste signature', amount: 12000 },
  { label: 'Styling Vioutou', amount: 3000 }
];

function outfitRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 7,
    name: 'Look Forfait',
    image_url: '/look.jpg',
    custom_price: 25000,
    pricing_mode: 'flat',
    price_breakdown: BREAKDOWN,
    show_price_breakdown: true,
    product_ids: [],
    visible: true,
    position: 1,
    created_at: '2026-01-02',
    updated_at: '2026-01-02',
    ...overrides
  };
}

function mockSnapshot(outfit: Record<string, unknown>) {
  mocks.supabase.rpc.mockResolvedValue({ data: [], error: null });
  mocks.supabase.from.mockImplementation((table: string) => {
    if (table === 'products') {
      return {
        select: () => ({
          eq: () => ({
            order: () => ({ data: [VISIBLE_PRODUCT], error: null })
          })
        })
      };
    }
    if (table === 'categories') {
      return {
        select: () => ({
          eq: () => ({
            order: () => ({ data: [], error: null })
          })
        })
      };
    }
    return {
      select: () => ({
        eq: () => ({
          order: () => ({
            order: () => ({ data: [outfit], error: null })
          })
        })
      })
    };
  });
}

describe('Unit — IMPL-4 : service outfits (décomposition)', () => {
  let insert: ReturnType<typeof vi.fn>;
  let single: ReturnType<typeof vi.fn>;
  let results: Array<{ data: unknown; error: unknown }>;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    results = [];
    single = vi.fn(async () => results.shift() ?? { data: null, error: null });
    insert = vi.fn(() => ({ select: () => ({ single }) }));
    mocks.supabase.from.mockReturnValue({ insert });
  });

  it('createOutfit transmet price_breakdown et show_price_breakdown', async () => {
    results.push({ data: { id: 1 }, error: null });
    const { createOutfit } = await import('@/services/outfitService');
    await createOutfit({
      name: 'Look BD',
      image_url: '/look.jpg',
      custom_price: 25000,
      pricing_mode: 'flat',
      price_breakdown: BREAKDOWN,
      show_price_breakdown: true,
      product_ids: [],
      visible: true
    });

    const row = insert.mock.calls[0][0][0] as Record<string, unknown>;
    expect(row.price_breakdown).toEqual(BREAKDOWN);
    expect(row.show_price_breakdown).toBe(true);
  });

  it('pré-migration (42703) : le repli historique retire AUSSI les colonnes de décomposition', async () => {
    results.push({ data: null, error: { code: '42703', message: 'column "price_breakdown" of relation "outfits" does not exist' } });
    results.push({ data: { id: 2 }, error: null });
    const { createOutfit } = await import('@/services/outfitService');
    const result = await createOutfit({
      name: 'Look Legacy',
      image_url: '/look.jpg',
      product_ids: [101],
      visible: true,
      pricing_mode: 'calculated',
      price_breakdown: null,
      show_price_breakdown: false
    });

    expect(insert).toHaveBeenCalledTimes(2);
    const legacyRow = insert.mock.calls[1][0][0] as Record<string, unknown>;
    expect(legacyRow.price_breakdown).toBeUndefined();
    expect(legacyRow.show_price_breakdown).toBeUndefined();
    expect(legacyRow.pricing_mode).toBeUndefined();
    expect(result.data?.id).toBe(2);
  });

  it("pré-migration (42703) : le forfait avec décomposition reste une erreur explicite", async () => {
    results.push({ data: null, error: { code: '42703', message: 'column "pricing_mode" of relation "outfits" does not exist' } });
    const { createOutfit } = await import('@/services/outfitService');
    const result = await createOutfit({
      name: 'Look Impossible',
      image_url: '/look.jpg',
      custom_price: 25000,
      pricing_mode: 'flat',
      price_breakdown: BREAKDOWN,
      show_price_breakdown: true,
      product_ids: [],
      visible: true
    });

    expect(result.data).toBeNull();
    expect(result.error).toContain('add_outfit_price_breakdown.sql');
  });
});

describe('Unit — IMPL-4 : exposition publique (C4)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("forfait + interrupteur activé : la décomposition est exposée au public", async () => {
    mockSnapshot(outfitRow());
    const { fetchPublicCatalogSnapshot } = await import('@/services/publicCatalogService');
    const snapshot = await fetchPublicCatalogSnapshot();

    const look = snapshot.outfits.find((o) => o.id === '7');
    expect(look?.priceBreakdown).toEqual(BREAKDOWN);
    expect(look?.price).toBe(25000);
  });

  it("interrupteur désactivé : la décomposition n'est PAS exposée (même stockée)", async () => {
    mockSnapshot(outfitRow({ show_price_breakdown: false }));
    const { fetchPublicCatalogSnapshot } = await import('@/services/publicCatalogService');
    const snapshot = await fetchPublicCatalogSnapshot();

    expect(snapshot.outfits.find((o) => o.id === '7')?.priceBreakdown).toBeUndefined();
  });

  it("mode calculé : la décomposition n'est PAS exposée (même stockée et activée)", async () => {
    mockSnapshot(outfitRow({ pricing_mode: 'calculated', show_price_breakdown: true }));
    const { fetchPublicCatalogSnapshot } = await import('@/services/publicCatalogService');
    const snapshot = await fetchPublicCatalogSnapshot();

    expect(snapshot.outfits.find((o) => o.id === '7')?.priceBreakdown).toBeUndefined();
  });

  it('lignes invalides écartées (libellé vide, montant non numérique)', async () => {
    mockSnapshot(outfitRow({
      price_breakdown: [
        { label: 'Veste signature', amount: 12000 },
        { label: '   ', amount: 3000 },
        { label: 'Casque', amount: Number.NaN },
        null
      ]
    }));
    const { fetchPublicCatalogSnapshot } = await import('@/services/publicCatalogService');
    const snapshot = await fetchPublicCatalogSnapshot();

    expect(snapshot.outfits.find((o) => o.id === '7')?.priceBreakdown).toEqual([
      { label: 'Veste signature', amount: 12000 }
    ]);
  });
});

describe('Unit — IMPL-4 : gardes anti-dérive (sources)', () => {
  it('la migration : garde prérequis, 2 colonnes, CHECK structurel immutable, trigger IMPL-3 NON modifié, rollback avant begin', async () => {
    const sql = await readFile('supabase/migrations/add_outfit_price_breakdown.sql', 'utf-8');
    expect(sql).toContain("to_regclass('public.outfits')");
    expect(sql).toContain('PRÉREQUIS ABSENT');
    expect(sql).toContain('add column if not exists price_breakdown jsonb');
    expect(sql).toContain('add column if not exists show_price_breakdown boolean not null default false');
    expect(sql).toContain('create or replace function public.outfit_price_breakdown_valid');
    expect(sql).toContain('immutable');
    expect(sql).toContain('outfits_price_breakdown_check');
    // le trigger IMPL-3 ne doit PAS être retouché (le prix reste intacts)
    expect(sql).not.toContain('create or replace function public.set_outfit_price');
    expect(sql).not.toContain('create trigger');
    // rollback documenté AVANT le begin
    expect(sql.indexOf('Rollback')).toBeLessThan(sql.indexOf('begin;'));
    expect(sql).toContain('drop column if exists price_breakdown');
    expect(sql).toContain('drop column if exists show_price_breakdown');
  });

  it("l'admin HPB : éditeur borné au forfait, interrupteur public, validation, aucun article catalogue", async () => {
    const page = await readFile('src/app/admin/hpb/page.tsx', 'utf-8');
    expect(page).toContain('Décomposition du forfait (optionnel)');
    expect(page).toContain('Ces lignes ne créent aucun article catalogue');
    expect(page).toContain('+ Ajouter une ligne');
    expect(page).toContain('Afficher la décomposition sur la boutique');
    expect(page).toContain('Décomposition incomplète : chaque ligne doit avoir un libellé et un montant');
    expect(page).toContain('le forfait reste la référence');
    // payload : décomposition + interrupteur transmis
    expect(page).toContain('price_breakdown: filledLines.length > 0');
    expect(page).toContain("show_price_breakdown: pricingMode === 'flat' && showBreakdown");
    // badge liste : condition exacte du badge « Décomposition »
    expect(page).toContain('outfit.show_price_breakdown && (outfit.price_breakdown?.length ?? 0) > 0');
  });

  it('rendu public : grille et modal affichent la décomposition, conditionnellement', async () => {
    const page = await readFile('src/app/looks/hp-looks-client.tsx', 'utf-8');
    expect(page).toContain('outfit.priceBreakdown && outfit.priceBreakdown.length > 0');
    expect(page).toContain('Ce que comprend le forfait');
    expect(page).toContain('(outfit.products.length > 0 || (outfit.priceBreakdown?.length ?? 0) > 0)');

    const modal = await readFile('src/components/public/LookModal.tsx', 'utf-8');
    expect(modal).toContain('outfit.priceBreakdown && outfit.priceBreakdown.length > 0');
    expect(modal).toContain('Ce que comprend le forfait');
    expect(modal).toContain('(outfit.products.length > 0 || (outfit.priceBreakdown?.length ?? 0) > 0)');
  });

  it('types : OutfitPriceLine (admin) + champs AdminOutfit/OutfitFormData + champ public priceBreakdown', async () => {
    const admin = await readFile('src/admin/types.ts', 'utf-8');
    expect(admin).toContain('export interface OutfitPriceLine');
    expect(admin.match(/price_breakdown\?: OutfitPriceLine\[\] \| null;/g)?.length).toBe(2);
    expect(admin.match(/show_price_breakdown\?: boolean;/g)?.length).toBe(2);

    const types = await readFile('src/types/index.ts', 'utf-8');
    expect(types).toContain('priceBreakdown?: { label: string; amount: number }[];');
  });
});
