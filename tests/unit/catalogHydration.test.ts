import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fous PERF-02 — Suppression du double chargement des données :
// - le serveur hydrate les contextes clients (DataHydrator) : zéro requête
//   REST catalogue/settings au chargement des pages publiques ;
// - dégradation propre : snapshot fallback (source !== 'supabase') ou
//   réglages absents -> le client fetch comme avant ;
// - déduplication serveur via React cache() (metadata + page : 1 fetch) ;
// - realtime et refresh historiques INTACTS.
describe('Unit — PERF-02 Hydratation serveur -> contextes clients', () => {
  it('CatalogContext : hydratation injectée = aucun fetch, garde source supabase', async () => {
    const ctx = await readFile('src/context/CatalogContext.tsx', 'utf-8');
    expect(ctx).toContain('export function hydrateCatalogSnapshot(');
    expect(ctx).toContain("snapshot?.source === 'supabase'");
    expect(ctx).toContain('if (injectedCatalogSnapshot) {');
    expect(ctx).toContain('setCatalog(injectedCatalogSnapshot);');
    // Le chemin historique (fetch client) reste pour la dégradation.
    expect(ctx).toContain('await fetchPublicCatalogSnapshot()');
    // Realtime inchangé.
    expect(ctx).toContain('useCatalogRealtime(');
  });

  it('résilience galerie : outfits Supabase vide/en erreur ne vide JAMAIS les HP Looks', async () => {
    // Régression 01/09 : intro sans vignettes + carousel vide alors que le
    // logo vivait — une réponse outfits []/erreur remplaçait silencieusement
    // les 32 looks statiques. Les DEUX chemins (client + serveur) doivent
    // conserver le fallback.
    const svc = await readFile('src/services/publicCatalogService.ts', 'utf-8');
    expect(svc.match(/normalizedOutfits\.length > 0 \? normalizedOutfits : fallbackOutfits/g)?.length).toBe(2);
    expect(svc).toContain('outfitsResponse.error ? null : outfitsResponse.data');
  });

  it('settingsService : lecture serveur dédiée + amorçage du cache TTL partagé', async () => {
    const svc = await readFile('src/services/settingsService.ts', 'utf-8');
    expect(svc).toContain('export async function fetchServerPublicShopSettings(');
    expect(svc).toContain("createClient(url, anonKey, { auth: { persistSession: false } })");
    expect(svc).toContain("from('public_shop_settings')");
    expect(svc).toContain('export function seedPublicShopSettingsCache(');
    expect(svc).toContain('expiresAt: Date.now() + PUBLIC_SETTINGS_TTL_MS');
  });

  it('DataHydrator : composant client invisible qui injecte les deux sources', async () => {
    const h = await readFile('src/components/public/DataHydrator.tsx', 'utf-8');
    expect(h).toContain("'use client'");
    expect(h).toContain('hydrateCatalogSnapshot(snapshot)');
    expect(h).toContain('seedPublicShopSettingsCache(settings)');
    expect(h).toContain('return null');
  });

  it('home : page async, double hydratation (catalogue + réglages), cache()', async () => {
    const page = await readFile('src/app/page.tsx', 'utf-8');
    expect(page).toContain('export default async function HomePage()');
    expect(page).toContain('const getServerSnapshot = cache(fetchServerCatalogSnapshot);');
    expect(page).toContain('const getServerSettings = cache(fetchServerPublicShopSettings);');
    // Consolidation 09/2026 : l'hydrateur est remonté au LAYOUT racine (fix
    // hydratation #418) — il rend AVANT les providers, voir hydrationLayout.test.ts.
    const layout = await readFile('src/app/layout.tsx', 'utf-8');
    expect(layout).toContain('<DataHydrator snapshot={snapshot} settings={settings} siteAssets={siteAssets} />');
  });

  const PAGES = [
    ['src/app/produit/[id]/page.tsx', '<ProductPage />'],
    ['src/app/looks/page.tsx', '<HPLooksPage />'],
    ['src/app/categorie/[slug]/page.tsx', '<CategoryPage />'],
  ];

  it.each(PAGES)('%s : page async + hydratation catalogue + dédup cache()', async (path, marker) => {
    const page = await readFile(path, 'utf-8');
    expect(page).toContain('const getSnapshot = cache(fetchServerCatalogSnapshot);');
    expect(page).toContain('await getSnapshot();');
    // Consolidation 09/2026 : <DataHydrator> vit désormais au layout racine,
    // FRÈRE PRÉCÉDANT les providers (fix #418) — les pages ne le rendent plus.
    expect(page).not.toContain('<DataHydrator');
    const layout = await readFile('src/app/layout.tsx', 'utf-8');
    expect(layout.indexOf('<DataHydrator')).toBeGreaterThan(-1);
    expect(layout.indexOf('<CatalogProvider>')).toBeGreaterThan(layout.indexOf('<DataHydrator'));
    expect(page).toContain(marker);
    // Plus AUCUN fetch direct non dédupliqué dans ces pages.
    expect(page).not.toContain('await fetchServerCatalogSnapshot()');
    expect(page).toContain('export default async function Page()');
  });

  it('PublicSettingsContext : rafraîchissement realtime historique intact', async () => {
    const ctx = await readFile('src/context/PublicSettingsContext.tsx', 'utf-8');
    expect(ctx).toContain('fetchPublicShopSettings()');
    expect(ctx).toContain('useShopSettingsRealtime(refresh)');
    expect(ctx).toContain('useSiteAssetsRealtime(refresh)');
  });
});
