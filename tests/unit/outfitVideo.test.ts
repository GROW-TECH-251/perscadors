import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile } from 'fs/promises';

// IMPL-C (UI Boost 09/2026, décision validée) — vidéos des HP Looks :
// - vidéo optionnelle par look (outfits.video_url/video_public_id, pattern
//   produit IMP-08), présentée EN PREMIER dans la modale d'inspection
//   UNIQUEMENT (grille /looks et carrousel accueil inchangés : image) ;
// - upload/remplacement/suppression dans le formulaire HPB (mêmes règles que
//   les produits : video/* + .mp4/.mov/.webm, 30 Mo max) ;
// - allowlist Cloudinary perscadors/outfits/{id} (même règle que products) ;
// - échec de chargement -> repli image (le look reste toujours consultable) ;
// - résilience pré-migration (42703) : vidéo fournie -> message explicite,
//   jamais de perte silencieuse ; sans vidéo -> repli historique.

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

describe('Unit — IMPL-C : allowlist Cloudinary (dossier par look)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('perscadors/outfits/{id} est autorisé, comme products/{id}', async () => {
    const { isAllowedMediaFolder } = await import('@/lib/cloudinary');
    expect(isAllowedMediaFolder('perscadors/outfits/12')).toBe(true);
    expect(isAllowedMediaFolder('perscadors/outfits/abc_-X9')).toBe(true);
    expect(isAllowedMediaFolder('perscadors/outfits/draft')).toBe(true);
  });

  it('refuse les variantes invalides (pas d’id, traversée, espace, sous-dossier)', async () => {
    const { isAllowedMediaFolder } = await import('@/lib/cloudinary');
    expect(isAllowedMediaFolder('perscadors/outfits')).toBe(false);
    expect(isAllowedMediaFolder('perscadors/outfits/')).toBe(false);
    expect(isAllowedMediaFolder('perscadors/outfits/12/x')).toBe(false);
    expect(isAllowedMediaFolder('perscadors/outfits/../../secret')).toBe(false);
    expect(isAllowedMediaFolder('perscadors/outfits/a b')).toBe(false);
    expect(isAllowedMediaFolder('perscadors/OUTFITS/12')).toBe(false);
  });

  it('les produits et les 4 sections restent autorisés (non-régression)', async () => {
    const { isAllowedMediaFolder } = await import('@/lib/cloudinary');
    expect(isAllowedMediaFolder('perscadors/products/7')).toBe(true);
    expect(isAllowedMediaFolder('perscadors/hero')).toBe(true);
    expect(isAllowedMediaFolder('perscadors/logo')).toBe(true);
    expect(isAllowedMediaFolder('perscadors/testimonials')).toBe(true);
    expect(isAllowedMediaFolder('perscadors/ambience')).toBe(true);
  });
});

describe('Unit — IMPL-C : service outfits (vidéo + résilience)', () => {
  let insert: ReturnType<typeof vi.fn>;
  let single: ReturnType<typeof vi.fn>;
  let results: Array<{ data: unknown; error: unknown }>;

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    results = [];
    single = vi.fn(async () => results.shift() ?? { data: null, error: null });
    insert = vi.fn((_row: Record<string, unknown>) => ({ select: () => ({ single }) }));
    mocks.supabase.from.mockReturnValue({ insert });
    mocks.supabase.rpc.mockResolvedValue({ data: [], error: null });
  });

  it('createOutfit transmet video_url et video_public_id', async () => {
    results.push({ data: { id: 1 }, error: null });
    const { createOutfit } = await import('@/services/outfitService');
    await createOutfit({
      name: 'Look Vidé',
      image_url: '/look.jpg',
      product_ids: [],
      visible: true,
      video_url: 'https://res.cloudinary.com/demo/video/upload/look.mp4',
      video_public_id: 'perscadors/outfits/1/xyz'
    });

    const row = insert.mock.calls[0][0][0] as Record<string, unknown>;
    expect(row.video_url).toBe('https://res.cloudinary.com/demo/video/upload/look.mp4');
    expect(row.video_public_id).toBe('perscadors/outfits/1/xyz');
  });

  it('pré-migration (42703) + vidéo : erreur explicite, pas de perte silencieuse', async () => {
    results.push({ data: null, error: { code: '42703', message: 'column "video_url" of relation "outfits" does not exist' } });
    const { createOutfit } = await import('@/services/outfitService');
    const result = await createOutfit({
      name: 'Look Vidé Impossible',
      image_url: '/look.jpg',
      product_ids: [],
      visible: true,
      video_url: 'https://res.cloudinary.com/demo/video/upload/look.mp4',
      video_public_id: 'perscadors/outfits/1/xyz'
    });

    expect(insert).toHaveBeenCalledTimes(1);
    expect(result.data).toBeNull();
    expect(result.error).toContain('add_outfit_video.sql');
  });

  it('pré-migration (42703) sans vidéo : repli historique qui retire AUSSI les colonnes vidéo', async () => {
    results.push({ data: null, error: { code: '42703', message: 'column "pricing_mode" of relation "outfits" does not exist' } });
    results.push({ data: { id: 2 }, error: null });
    const { createOutfit } = await import('@/services/outfitService');
    const result = await createOutfit({
      name: 'Look Legacy',
      image_url: '/look.jpg',
      product_ids: [101],
      visible: true
    });

    expect(insert).toHaveBeenCalledTimes(2);
    const legacyRow = insert.mock.calls[1][0][0] as Record<string, unknown>;
    expect(legacyRow.video_url).toBeUndefined();
    expect(legacyRow.video_public_id).toBeUndefined();
    expect(legacyRow.pricing_mode).toBeUndefined();
    expect(result.data?.id).toBe(2);
  });
});

describe('Unit — IMPL-C : exposition publique (modale uniquement)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('un look avec video_url expose .video ; sans vidéo -> undefined', async () => {
    const outfitRow = {
      id: 7, name: 'Look', image_url: '/l.jpg', custom_price: 10000,
      product_ids: [101], visible: true, position: 1,
      created_at: '2026-01-01', updated_at: '2026-01-01',
      video_url: 'https://res.cloudinary.com/demo/video/upload/look.mp4'
    };
    mocks.supabase.rpc.mockResolvedValue({ data: [], error: null });
    mocks.supabase.from.mockImplementation((table: string) => {
      if (table === 'products') {
        return { select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }) };
      }
      if (table === 'categories') {
        return { select: () => ({ eq: () => ({ order: () => ({ data: [], error: null }) }) }) };
      }
      return { select: () => ({ eq: () => ({ order: () => ({ order: () => ({ data: [outfitRow], error: null }) }) }) }) };
    });

    const { fetchPublicCatalogSnapshot } = await import('@/services/publicCatalogService');
    const snapshot = await fetchPublicCatalogSnapshot();
    expect(snapshot.outfits.find((o) => o.id === '7')?.video).toBe('https://res.cloudinary.com/demo/video/upload/look.mp4');
  });
});

describe('Unit — IMPL-C : gardes anti-dérive (sources)', () => {
  it('LookModal : vidéo EN PREMIER (poster image, onError -> image), image sinon', async () => {
    const modal = await readFile('src/components/public/LookModal.tsx', 'utf-8');
    expect(modal).toContain('outfit.video && failedVideo !== outfit.video ? (');
    expect(modal).toContain('poster={outfit.image}');
    expect(modal).toContain('onError={() => setFailedVideo(outfit.video ?? null)}');
    expect(modal).toContain('preload="metadata"');
    expect(modal).toContain('playsInline');
  });

  it('décision respectée : AUCUNE vidéo dans la grille /looks ni le carrousel accueil', async () => {
    const page = await readFile('src/app/looks/hp-looks-client.tsx', 'utf-8');
    expect(page).not.toContain('<video');
    const carousel = await readFile('src/components/public/home/OutfitCarousel.tsx', 'utf-8');
    expect(carousel).not.toContain('<video');
  });

  it('formulaire HPB : upload/remplace/retire avec les règles produit (30 Mo, MIME, accept)', async () => {
    const page = await readFile('src/app/admin/hpb/page.tsx', 'utf-8');
    expect(page).toContain('uploadOutfitVideo');
    expect(page).toContain('deleteOutfitVideo');
    expect(page).toContain('accept="video/mp4,video/webm,video/quicktime"');
    expect(page).toContain('La vidéo ne doit pas dépasser 30 Mo.');
    expect(page).toContain('Remplacer la vidéo');
    expect(page).toContain('Retirer la vidéo');
    expect(page).toContain('video_url: videoUrl,');
  });

  it('mediaService : uploadOutfitVideo cible perscadors/outfits/{id} (pattern produit)', async () => {
    const svc = await readFile('src/services/mediaService.ts', 'utf-8');
    expect(svc).toContain('perscadors/outfits/${safeOutfitId}');
    expect(svc).toContain('export async function deleteOutfitVideo');
  });

  it('la migration : 2 colonnes idempotentes + garde prérequis + rollback documenté avant begin', async () => {
    const sql = await readFile('supabase/migrations/add_outfit_video.sql', 'utf-8');
    expect(sql).toContain('add column if not exists video_url text null');
    expect(sql).toContain('add column if not exists video_public_id text null');
    expect(sql).toContain("to_regclass('public.outfits')");
    expect(sql).toContain('PRÉREQUIS ABSENT');
    expect(sql.indexOf('Rollback')).toBeLessThan(sql.indexOf('begin;'));
  });
});
