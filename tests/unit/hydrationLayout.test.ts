import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { readdir } from 'fs/promises';

// Consolidation 09/2026 — fix hydratation React #418 (mesuré en prod) :
// le premier rendu client doit partir des DONNÉES SERVEUR. Le DataHydrator
// doit rendre AVANT les providers (frère précédent dans le layout racine).
describe('Unit — Hydratation : providers initialisés avec les données serveur', () => {
  it('layout racine : DataHydrator rendu AVANT CatalogProvider/PublicSettingsProvider', async () => {
    const source = await readFile('src/app/layout.tsx', 'utf-8');
    const iHydrator = source.indexOf('<DataHydrator snapshot={snapshot}');
    const iCatalog = source.indexOf('<CatalogProvider>');
    const iSettings = source.indexOf('<PublicSettingsProvider>');
    expect(iHydrator).toBeGreaterThan(-1);
    expect(iCatalog).toBeGreaterThan(iHydrator);
    expect(iSettings).toBeGreaterThan(iHydrator);
    // Le layout est async et alimente le DataHydrator depuis les mêmes
    // fetch cache() que les pages (une seule source par génération ISR).
    expect(source).toContain('export default async function RootLayout');
    expect(source).toContain('const getLayoutSnapshot = cache(fetchServerCatalogSnapshot)');
  });

  it('pages : PLUS AUCUNE page ne rend son propre DataHydrator (sinon payload dupliqué)', async () => {
    const pages = [
      'src/app/page.tsx',
      'src/app/looks/page.tsx',
      'src/app/produit/[id]/page.tsx',
      'src/app/categorie/[slug]/page.tsx',
    ];
    for (const page of pages) {
      const source = await readFile(page, 'utf-8');
      expect(source.includes('<DataHydrator'), page).toBe(false);
    }
  });

  it('PublicSettingsContext : état initial = valeur semée (sinon défauts != serveur)', async () => {
    const source = await readFile('src/context/PublicSettingsContext.tsx', 'utf-8');
    expect(source).toContain('() => readSeededPublicShopSettings() ?? getDefaultShopSettings()');
  });

  it('settingsService : lecteur synchrone du cache semé (aucune requête)', async () => {
    const source = await readFile('src/services/settingsService.ts', 'utf-8');
    expect(source).toContain('export function readSeededPublicShopSettings');
  });
});
