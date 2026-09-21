import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile } from 'fs/promises';

// IMPL-A (UI Boost 09/2026) — bannière de partage : l'image configurée dans le
// Dashboard (Médias → « Bannière de partage » = site_assets section ambience)
// doit être la source de vérité des métadonnées OG.
//
// Cause racine corrigée (audit Phase 7) : normalizeShopSettings remplissait
// social_image_url absent par une image codée en dur, et upsertShopSettings
// persistait l'objet complet -> chaque sauvegarde des Réglages réécrivait
// l'ancienne image en base, prioritaire sur la bannière dans layout.tsx.
//
// Garantis ici :
// - plus AUCUN défaut social_image_url écrit (normalize + defaults) ;
// - une valeur explicite, si elle existe, est préservée telle quelle ;
// - la priorité du layout : bannière Médias > social_image_url > fallback ;
// - la lecture anon passe toujours par la vue public_shop_settings (fix
//   PUB-DATA-01 préservée) ;
// - migration de nettoyage : ne touche QUE la valeur périmée connue.

const STALE_DEFAULT = '/assets/collections/articles/BASKET POUR HOMME/IMG-20251014-WA0036.jpg';

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

const BASE_ROW = {
  id: true,
  shop_name: 'HP Collection',
  whatsapp_phone: '22967280018',
  updated_at: '2026-09-21T00:00:00.000Z'
};

function mockShopSettingsTable(row: Record<string, unknown> | null) {
  const maybeSingle = vi.fn(async () => ({ data: row, error: null }));
  const single = vi.fn(async () => ({ data: row ?? BASE_ROW, error: null }));
  const upsert = vi.fn((_payload: Record<string, unknown>) => ({ select: () => ({ single }) }));
  const select = vi.fn(() => ({ order: () => ({ limit: () => ({ maybeSingle }) }) }));
  mocks.supabase.from.mockReturnValue({ select, upsert });
  return { upsert, maybeSingle };
}

describe('Unit — IMPL-A : upsertShopSettings n’écrit plus de défaut social_image_url', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('social_image_url absent en base -> l’upsert ne réécrit PAS l’ancienne image codée en dur', async () => {
    const { upsert } = mockShopSettingsTable({ ...BASE_ROW }); // pas de social_image_url
    const { upsertShopSettings } = await import('@/services/settingsService');
    await upsertShopSettings({ shop_name: 'HP Collection' });

    expect(upsert).toHaveBeenCalledTimes(1);
    const payload = upsert.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.social_image_url).toBeUndefined();
  });

  it('une valeur explicite est préservée telle quelle (aucun écrasement)', async () => {
    const { upsert } = mockShopSettingsTable({ ...BASE_ROW, social_image_url: '/ma-banniere.png' });
    const { upsertShopSettings } = await import('@/services/settingsService');
    await upsertShopSettings({ shop_name: 'HP Collection' });

    const payload = upsert.mock.calls[0][0] as Record<string, unknown>;
    expect(payload.social_image_url).toBe('/ma-banniere.png');
  });
});

describe('Unit — IMPL-A : gardes anti-dérive (sources)', () => {
  it('plus aucun défaut social_image_url dans settingsService (defaults ni normalisation)', async () => {
    const svc = await readFile('src/services/settingsService.ts', 'utf-8');
    expect(svc).toContain('social_image_url: undefined,');
    expect(svc).toContain('social_image_url: rawSettings?.social_image_url || undefined,');
    expect(svc).not.toContain(`social_image_url: '${STALE_DEFAULT}'`);
  });

  it('layout : la bannière Médias (ambience) est PRIORITAIRE sur social_image_url, fallback en dernier', async () => {
    const layout = await readFile('src/app/layout.tsx', 'utf-8');
    expect(layout).toContain('image = bannerResponse.data?.url || data?.social_image_url || image;');
    // l'ancienne priorité inversée a disparu
    expect(layout).not.toContain('image = data.social_image_url || bannerResponse.data?.url || image;');
    // le fallback codé en dur reste défini (dernier recours uniquement)
    expect(layout).toContain("const FALLBACK_IMAGE = '/assets/collections/articles/BASKET POUR HOMME/IMG-20251014-WA0036.jpg'");
  });

  it('lecture anon inchangée : vue public_shop_settings, jamais la table shop_settings en direct', async () => {
    const layout = await readFile('src/app/layout.tsx', 'utf-8');
    expect(layout).toContain("from('public_shop_settings')");
    // (le commentaire historique FIX PUB-DATA-01 documente l'ancienne lecture
    //  directe de la table : on ne peut pas interdire la sous-chaîne, on
    //  garantit la présence de la vue et l'absence d'appel réel hors commentaire)
    const codeSansCommentaires = layout.split('\n').filter((line) => !line.trim().startsWith('//')).join('\n');
    expect(codeSansCommentaires).not.toMatch(/\.from\('shop_settings'\)/);
  });

  it('la migration de nettoyage ne cible QUE la valeur périmée connue (avec garde + rollback)', async () => {
    const sql = await readFile('supabase/migrations/clear_stale_social_image_url.sql', 'utf-8');
    expect(sql).toContain("to_regclass('public.shop_settings')");
    expect(sql).toContain('PRÉREQUIS ABSENT');
    expect(sql).toContain(`where social_image_url = '${STALE_DEFAULT}'`);
    expect(sql).not.toMatch(/set\s+social_image_url\s*=\s*null\s+where\s+social_image_url\s+is\s+not\s+null/i);
    expect(sql.indexOf('Rollback')).toBeLessThan(sql.indexOf('begin;'));
  });
});
