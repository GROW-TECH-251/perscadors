import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fous PERF-03 — Hiérarchie médias :
// - vidéos testimonials (3,9 Mo, below-fold) montées uniquement à l'approche
//   du viewport (IntersectionObserver, marge 300px, placeholder skeleton) ;
// - dernière requête REST client éliminée : site_assets lu côté serveur et
//   le cache TTL est amorcé (même pattern que PERF-02), sur les 4 pages ;
// - dégradation propre : sans observer -> montage immédiat ; assets absents
//   -> comportement historique ;
// - les vidéos une fois montées gardent controls/preload=metadata/playsInline.
describe('Unit — PERF-03 Hiérarchie médias', () => {
  it('Testimonials : vidéos différées à l’approche du viewport (observer + marge + placeholder)', async () => {
    const t = await readFile('src/components/public/home/Testimonials.tsx', 'utf-8');
    expect(t).toContain('new IntersectionObserver(');
    expect(t).toContain("rootMargin: '300px'");
    expect(t).toContain('observer.disconnect()');
    expect(t).toContain('videosVisible ? (');
    expect(t).toContain('skeleton-media" aria-busy="true"');
    // Dégradation : très anciens navigateurs -> montage immédiat.
    expect(t).toContain("typeof IntersectionObserver === 'undefined'");
  });

  it('Testimonials : les <video> ne sont PAS rendues avant visibilité', async () => {
    const t = await readFile('src/components/public/home/Testimonials.tsx', 'utf-8');
    // Le <video> est dans la branche conditionnelle videosVisible.
    expect(t).toMatch(/videosVisible \? \(\s*<video/);
    // Attributs conservés une fois montées.
    expect(t).toContain('preload="metadata"');
    expect(t).toContain('playsInline');
    expect(t).toContain('controls');
  });

  it('mediaService : lecture serveur site_assets + amorçage cache TTL (garde null)', async () => {
    const m = await readFile('src/services/mediaService.ts', 'utf-8');
    expect(m).toContain('export async function fetchServerSiteAssets(');
    expect(m).toContain("createClient(url, anonKey, { auth: { persistSession: false } })");
    expect(m).toContain("from('site_assets')");
    expect(m).toContain('if (error || !data || data.length === 0) return null;');
    expect(m).toContain('export function seedSiteAssetsCache(');
    expect(m).toContain('expiresAt: Date.now() + SITE_ASSETS_TTL_MS');
  });

  it('DataHydrator : accepte et sème les siteAssets', async () => {
    const h = await readFile('src/components/public/DataHydrator.tsx', 'utf-8');
    expect(h).toContain('siteAssets?: SiteAsset[] | null;');
    expect(h).toContain('if (siteAssets) seedSiteAssetsCache(siteAssets);');
  });

  const PAGES = [
    'src/app/page.tsx',
    'src/app/produit/[id]/page.tsx',
    'src/app/looks/page.tsx',
    'src/app/categorie/[slug]/page.tsx',
  ];

  it.each(PAGES)('%s : site_assets lus côté serveur (cache) et passés à l’hydrator', async (path) => {
    const page = await readFile(path, 'utf-8');
    expect(page).toContain('fetchServerSiteAssets');
    expect(page).toMatch(/cache\(fetchServerSiteAssets\)/);
    expect(page).toContain('siteAssets={siteAssets}');
  });

  it('hiérarchie images conservée : priority réservé au hero, lazy par défaut ailleurs', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(hero.match(/priority/g)?.length).toBe(3); // poster vidéo + hero image + fallback (3 usages légitimes, tous above-fold)
    const curated = await readFile('src/components/public/home/CuratedCollections.tsx', 'utf-8');
    expect(curated).toContain('loading="lazy"');
    const grid = await readFile('src/components/public/home/CategoryGrid.tsx', 'utf-8');
    expect(grid).not.toContain('priority'); // lazy par défaut, pas de sur-priorisation
  });
});
