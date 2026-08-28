import { describe, it, expect, vi, beforeEach } from 'vitest';

// Impl 6 — Garde-fous contre la régression "latence" : fetchPublicShopSettings
// et fetchSiteAssets doivent dédupliquer les appels simultanés (UNE seule
// requête réseau pour N composants qui montent en même temps) et servir un
// cache mémoire à TTL court invalidable par le canal Realtime partagé.

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

vi.mock('@/services/cloudinaryVideoService', () => ({
  deleteCloudinaryVideo: vi.fn(),
  uploadCloudinaryVideo: vi.fn(),
}));

describe('Impl 6 — déduplication des fetchs publics', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('fetchPublicShopSettings ne déclenche qu UNE requête pour des appels simultanés', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { shop_name: 'HP Collection', whatsapp_phone: '22967280018' },
      error: null,
    });
    mocks.supabase.from.mockReturnValue({
      select: () => ({
        order: () => ({
          limit: () => ({ maybeSingle }),
        }),
      }),
    });

    const { fetchPublicShopSettings } = await import('@/services/settingsService');
    const [a, b, c] = await Promise.all([
      fetchPublicShopSettings(),
      fetchPublicShopSettings(),
      fetchPublicShopSettings(),
    ]);

    expect(maybeSingle).toHaveBeenCalledTimes(1);
    expect(a?.shop_name).toBe('HP Collection');
    expect(b?.shop_name).toBe('HP Collection');
    expect(c?.shop_name).toBe('HP Collection');
  });

  it('fetchPublicShopSettings sert le cache TTL puis re-requête après invalidation', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: { shop_name: 'HP Collection' },
      error: null,
    });
    mocks.supabase.from.mockReturnValue({
      select: () => ({
        order: () => ({
          limit: () => ({ maybeSingle }),
        }),
      }),
    });

    const { fetchPublicShopSettings, invalidatePublicShopSettingsCache } = await import('@/services/settingsService');

    await fetchPublicShopSettings();
    await fetchPublicShopSettings(); // cache TTL : aucune nouvelle requête
    expect(maybeSingle).toHaveBeenCalledTimes(1);

    invalidatePublicShopSettingsCache();
    await fetchPublicShopSettings(); // cache invalidé : nouvelle requête
    expect(maybeSingle).toHaveBeenCalledTimes(2);
  });

  it('fetchSiteAssets ne déclenche qu UNE requête pour des appels simultanés', async () => {
    const networkOp = vi.fn().mockResolvedValue({
      data: [{ id: 'a1', section: 'logo', url: '/logo.png', active: true, order_index: 0, updated_at: '2026-08-28T00:00:00Z' }],
      error: null,
    });
    mocks.supabase.from.mockReturnValue({
      select: () => ({ order: () => networkOp() }),
    });

    const { fetchSiteAssets, fetchActiveAssetBySection } = await import('@/services/mediaService');

    const results = await Promise.all([
      fetchSiteAssets(),
      fetchActiveAssetBySection('logo'),
      fetchActiveAssetBySection('hero'),
    ]);

    expect(networkOp).toHaveBeenCalledTimes(1);
    expect(results[0]).toHaveLength(1);
    expect(results[1]?.section).toBe('logo');
    expect(results[2]).toBeNull(); // aucun asset 'hero' actif dans le mock
  });

  it('fetchSiteAssets sert le cache TTL puis re-requête après invalidation', async () => {
    const networkOp = vi.fn().mockResolvedValue({
      data: [{ id: 'a1', section: 'logo', url: '/logo.png', active: true, order_index: 0, updated_at: '2026-08-28T00:00:00Z' }],
      error: null,
    });
    mocks.supabase.from.mockReturnValue({
      select: () => ({ order: () => networkOp() }),
    });

    const { fetchSiteAssets, invalidateSiteAssetsCache } = await import('@/services/mediaService');

    await fetchSiteAssets();
    await fetchSiteAssets();
    expect(networkOp).toHaveBeenCalledTimes(1);

    invalidateSiteAssetsCache();
    await fetchSiteAssets();
    expect(networkOp).toHaveBeenCalledTimes(2);
  });
});
