import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile } from 'fs/promises';

// IMPL-2 (décision C2, consolidation 09/2026) — composition publique des looks
// avec articles masqués :
// - l'article masqué référencé par un look VISIBLE apparaît dans SA composition
//   (photo, nom, prix), marqué catalogHidden, NON cliquable + « Indisponible » ;
// - il ne réintègre NI le catalogue (snapshot.products), NI les catégories ;
// - « Recréer ce look » ajoute TOUTES les pièces, masquées incluses (décision
//   user : le look est vendu tel que composé) ;
// - la somme de repli inclut les pièces masquées (alignée sur le trigger
//   set_outfit_price qui recalcule custom_price sur TOUS les product_ids) ;
// - RPC absente/erreur => comportement historique, aucun crash (déploiement
//   sans ordre imposé entre application et migration Supabase).

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
  sizes: ['41', '42'],
  colors: ['Noir'],
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

// Ligne renvoyée par la RPC get_outfit_composition_products (champs limités).
const HIDDEN_ROW = {
  id: 202,
  name: 'Complet Oversize',
  category: 'complet-pour-homme',
  price: 8000,
  image_url: '/complet.jpg',
  images: ['/complet.jpg'],
  sizes: ['L'],
  colors: [],
  stock: 3
};

const OUTFIT_ROW = {
  id: 7,
  name: 'Look Test',
  image_url: '/look.jpg',
  custom_price: null as number | null,
  product_ids: [101, 202],
  visible: true,
  position: 1,
  created_at: '2026-01-02',
  updated_at: '2026-01-02'
};

function mockCatalog(options: {
  rpcData?: unknown[] | null;
  rpcError?: { message: string } | null;
  outfit?: typeof OUTFIT_ROW;
} = {}) {
  const { rpcData = [HIDDEN_ROW] as unknown[], rpcError = null, outfit = OUTFIT_ROW } = options;
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
    // outfits : chaîne E1 (eq visible puis order position + created_at)
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
  mocks.supabase.rpc.mockResolvedValue({ data: rpcData, error: rpcError });
}

describe('Unit — IMPL-2 : composition publique avec article masqué (C2)', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("l'article masqué apparaît dans la composition du look, marqué catalogHidden", async () => {
    mockCatalog();
    const { fetchPublicCatalogSnapshot } = await import('@/services/publicCatalogService');
    const snapshot = await fetchPublicCatalogSnapshot();

    expect(snapshot.source).toBe('supabase');
    const look = snapshot.outfits.find((o) => o.id === '7');
    expect(look).toBeDefined();
    expect(look?.products.map((p) => p.id)).toEqual(['101', '202']);

    const hidden = look?.products.find((p) => p.id === '202');
    expect(hidden?.catalogHidden).toBe(true);
    expect(hidden?.name).toBe('Complet Oversize');
    expect(hidden?.images[0]).toBe('/complet.jpg');
    expect(hidden?.price).toBe(8000);
    expect(look?.products.find((p) => p.id === '101')?.catalogHidden).toBeUndefined();
  });

  it("l'article masqué ne réintègre NI le catalogue NI les catégories", async () => {
    mockCatalog();
    const { fetchPublicCatalogSnapshot } = await import('@/services/publicCatalogService');
    const snapshot = await fetchPublicCatalogSnapshot();

    expect(snapshot.products.map((p) => p.id)).toEqual(['101']);
    expect(snapshot.categories.some((c) => c.slug === 'complet-pour-homme')).toBe(false);
  });

  it('la somme de repli inclut la pièce masquée (alignée sur le trigger custom_price)', async () => {
    mockCatalog();
    const { fetchPublicCatalogSnapshot } = await import('@/services/publicCatalogService');
    const snapshot = await fetchPublicCatalogSnapshot();

    expect(snapshot.outfits.find((o) => o.id === '7')?.price).toBe(18000);
  });

  it('le forfait custom_price reste prioritaire sur la somme', async () => {
    mockCatalog({ outfit: { ...OUTFIT_ROW, custom_price: 15000 } });
    const { fetchPublicCatalogSnapshot } = await import('@/services/publicCatalogService');
    const snapshot = await fetchPublicCatalogSnapshot();

    expect(snapshot.outfits.find((o) => o.id === '7')?.price).toBe(15000);
  });

  it('RPC absente ou en erreur => composition visible seule, aucun crash (déploiement sans ordre)', async () => {
    mockCatalog({
      rpcData: null,
      rpcError: { message: 'function public.get_outfit_composition_products does not exist' }
    });
    const { fetchPublicCatalogSnapshot } = await import('@/services/publicCatalogService');
    const snapshot = await fetchPublicCatalogSnapshot();

    const look = snapshot.outfits.find((o) => o.id === '7');
    expect(look?.products.map((p) => p.id)).toEqual(['101']);
    expect(look?.price).toBe(10000);
  });

  it("un look composé uniquement d'articles masqués affiche SA composition complète", async () => {
    mockCatalog({ outfit: { ...OUTFIT_ROW, product_ids: [202], custom_price: null } });
    const { fetchPublicCatalogSnapshot } = await import('@/services/publicCatalogService');
    const snapshot = await fetchPublicCatalogSnapshot();

    const look = snapshot.outfits.find((o) => o.id === '7');
    expect(look?.products.map((p) => p.id)).toEqual(['202']);
    expect(look?.price).toBe(8000);
  });

  it('la RPC est appelée une seule fois par snapshot (chemin public)', async () => {
    mockCatalog();
    const { fetchPublicCatalogSnapshot } = await import('@/services/publicCatalogService');
    await fetchPublicCatalogSnapshot();

    expect(mocks.supabase.rpc).toHaveBeenCalledTimes(1);
    expect(mocks.supabase.rpc).toHaveBeenCalledWith('get_outfit_composition_products');
  });
});

describe('Unit — IMPL-2 : gardes anti-dérive (sources)', () => {
  it('la migration RPC est scopée : security definer, produits masqués de looks VISIBLES uniquement, grant anon, rollback documenté', async () => {
    const sql = await readFile('supabase/migrations/add_outfit_composition_public_rpc.sql', 'utf-8');
    expect(sql).toContain('security definer');
    expect(sql).toContain('set search_path = public');
    expect(sql).toContain('where p.visible = false');
    expect(sql).toContain('o.visible = true');
    expect(sql).toContain('grant execute on function public.get_outfit_composition_products() to anon, authenticated');
    expect(sql).toContain('drop function if exists public.get_outfit_composition_products()');
    // Garde anti-mauvais-projet (42P01 « relation public.products does not
    // exist » rencontré sur un projet/branche sans le schéma) : la migration
    // doit échouer avec un message explicite si les tables sont absentes.
    expect(sql).toContain("to_regclass('public.products')");
    expect(sql).toContain('PRÉREQUIS ABSENT');
    // jamais de ligne produit complète exposée : champs explicites uniquement
    expect(sql).not.toContain('to_jsonb(p)');
    expect(sql).toContain("jsonb_build_object(");
  });

  it('le catalogue public reste strictement filtré sur visible (products et categories)', async () => {
    const svc = await readFile('src/services/publicCatalogService.ts', 'utf-8');
    expect(svc).toContain(".eq('visible', true)");
    expect(svc).toContain('get_outfit_composition_products');
    expect(svc).toContain('catalogHidden: true');
  });

  it('pièce masquée = non cliquable + « Indisponible » ; pièce visible = lien fiche (modal + grille)', async () => {
    const modal = await readFile('src/components/public/LookModal.tsx', 'utf-8');
    expect(modal).toContain('product.catalogHidden ?');
    expect(modal).toContain('Indisponible');
    expect(modal).toContain('href={`/produit/${product.id}`}');

    const page = await readFile('src/app/looks/hp-looks-client.tsx', 'utf-8');
    expect(page).toContain('product.catalogHidden ?');
    expect(page).toContain('Indisponible');
    expect(page).toContain('href={`/produit/${product.id}`}');
  });

  it('« Recréer ce look » ajoute TOUTES les pièces du look, masquées incluses (décision user)', async () => {
    const carousel = await readFile('src/components/public/home/OutfitCarousel.tsx', 'utf-8');
    expect(carousel).toContain('onAdd={(look) => addMultipleToCart(look.products)}');

    const svc = await readFile('src/services/publicCatalogService.ts', 'utf-8');
    expect(svc).not.toContain('!p.catalogHidden');
  });

  it('Product expose le marqueur optionnel catalogHidden', async () => {
    const types = await readFile('src/types/index.ts', 'utf-8');
    expect(types).toContain('catalogHidden?: boolean');
  });
});
