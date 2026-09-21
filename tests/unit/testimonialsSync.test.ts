import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile } from 'fs/promises';

// IMPL-B (UI Boost 09/2026, décision validée) — témoignages 100 % configurables
// depuis le Dashboard :
// - les MÉDIAS (vidéos ET images) de témoignages viennent des site_assets
//   actifs de la section 'testimonials' (Médias → Témoignages) ;
// - la capture WhatsApp + la citation restent dans Réglages (schéma stocké) ;
// - plus AUCUNE vidéo par défaut codée en dur (settingsService ET le repli
//   DEFAULT_SITE_ASSETS de mediaService) : table vide = rien d'affiché ;
// - les éditeurs obsolètes de Réglages sont remplacés par un pointeur Médias.

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

function mockSiteAssetsTable(data: unknown[]) {
  mocks.supabase.from.mockImplementation((table: string) => {
    if (table !== 'site_assets') throw new Error(`table inattendue: ${table}`);
    return {
      select: () => ({
        order: () => ({ data, error: null })
      })
    };
  });
}

describe('Unit — IMPL-B : fetchActiveAssetsBySection (source vitrine des médias)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('ne renvoie QUE les assets actifs de la section testimonials, dans l’ordre', async () => {
    // (l'API réelle renvoie déjà les lignes triées par order_index — le mock
    //  reproduit cet ordre : d (1) avant a (2))
    mockSiteAssetsTable([
      { id: 'd', section: 'testimonials', active: true, order_index: 1, type: 'image', url: '/avis.jpg', title: 'Avis 1' },
      { id: 'a', section: 'testimonials', active: true, order_index: 2, type: 'video', url: '/v2.mp4', title: 'Avis 2' },
      { id: 'b', section: 'testimonials', active: false, order_index: 3, type: 'video', url: '/v1.mp4', title: 'Inactif' },
      { id: 'c', section: 'ambience', active: true, order_index: 1, type: 'image', url: '/banniere.jpg', title: 'Bannière' }
    ]);
    const { fetchActiveAssetsBySection } = await import('@/services/mediaService');
    const assets = await fetchActiveAssetsBySection('testimonials');

    expect(assets.map((a) => a.id)).toEqual(['d', 'a']);
    expect(assets.every((a) => a.section === 'testimonials' && a.active)).toBe(true);
  });

  it('table vide -> aucune vidéo fantôme pour la section (repli sans entrées testimonials)', async () => {
    mockSiteAssetsTable([]);
    const { fetchActiveAssetsBySection } = await import('@/services/mediaService');
    const assets = await fetchActiveAssetsBySection('testimonials');
    expect(assets).toEqual([]);
  });
});

describe('Unit — IMPL-B : gardes anti-dérive (sources)', () => {
  it('settingsService : plus aucune vidéo par défaut (defaults ET normalisation)', async () => {
    const svc = await readFile('src/services/settingsService.ts', 'utf-8');
    expect(svc).toContain('videos: []');
    expect(svc).toContain('videos: Array.isArray(cand.videos) ? cand.videos : []');
    expect(svc).not.toContain("src: '/assets/testimonials/video/client");
  });

  it('mediaService : le repli DEFAULT_SITE_ASSETS ne contient plus les 3 vidéos témoignages', async () => {
    const svc = await readFile('src/services/mediaService.ts', 'utf-8');
    expect(svc).not.toContain("id: 'testim-");
    expect(svc).not.toContain("url: '/assets/testimonials/video/client");
  });

  it('composant vitrine : site_assets rendus (vidéo ET image, titre/description de l’asset), capture/citation inchangées', async () => {
    const component = await readFile('src/components/public/home/Testimonials.tsx', 'utf-8');
    expect(component).toContain("fetchActiveAssetsBySection('testimonials')");
    expect(component).toContain("asset.type === 'video'");
    expect(component).toContain('{asset.title}');
    expect(component).toContain('{asset.description}');
    expect(component).toContain('screenshot_quote');
    expect(component).not.toContain('pickVideos');
    // repli texte : uniquement après chargement et si NI capture NI média
    expect(component).toContain('loaded && !hasScreenshot && !hasMedia');
  });

  it('Réglages : éditeurs vidéo obsolètes retirés, pointeur Médias présent', async () => {
    const page = await readFile('src/app/admin/reglages/page.tsx', 'utf-8');
    expect(page).not.toContain('handleVideoChange');
    expect(page).toContain('Gérer les médias de témoignages');
    expect(page).toContain("router.push('/admin/media')");
  });
});
