import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';

// MISSION SEO V2 (07/11) — garde-railles de l'identité de marque officielle.
// Perscadors = nom commercial · HP Collection = collection · Honoré
// Perscadors = propriétaire (Vioutou) · Honoré Perscadors Collection =
// désignation développée. Jamais « Conary Pescador » / « Conori Pescador ».

describe('Unit — MISSION SEO V2 : identité de marque et présence numérique', () => {
  it('Store Schema : Perscadors (nom commercial), HP Collection en alternateName, fondateur relié', async () => {
    const source = await readFile('src/app/page.tsx', 'utf-8');
    expect(source).toContain('"name": "Perscadors"');
    expect(source).toContain('"legalName": "Honoré Perscadors Collection"');
    expect(source).toContain('"alternateName": ["HP Collection", "Honoré Perscadors Collection", "HP Collection Bénin"]');
    expect(source).toContain('"name": "Honoré Perscadors"');
    expect(source).toContain('"alternateName": "Vioutou"');
    expect(source).toContain('Perscadors — boutique premium de mode streetwear HP Collection');
  });

  it('sameAs : uniquement des URLs vérifiées (TikTok, Google Maps) — jamais de lien de partage Facebook brut', async () => {
    const source = await readFile('src/app/page.tsx', 'utf-8');
    expect(source).toContain('"sameAs": [TIKTOK_URL, GOOGLE_MAPS_URL, ...(FACEBOOK_URL ? [FACEBOOK_URL] : [])]');
    // Le lien facebook.com/share/… fourni n'est PAS une URL permanente : il ne
    // doit jamais être publié comme valeur active (footer ou sameAs). La
    // constante reste vide tant que l'URL canonique n'est pas confirmée.
    expect(source).not.toContain('facebook.com/share');
    const social = await readFile('src/lib/socialLinks.ts', 'utf-8');
    expect(social).toMatch(/export const FACEBOOK_URL = '';/);
    expect(social).toContain("export const TIKTOK_URL = 'https://www.tiktok.com/@perscadors';");
  });

  it('geo : le pin de la fiche Google Maps officielle (jamais des coordonnées déduites)', async () => {
    const source = await readFile('src/app/page.tsx', 'utf-8');
    expect(source).toContain('STORE_GEO.latitude');
    expect(source).toContain('STORE_GEO.longitude');
    const social = await readFile('src/lib/socialLinks.ts', 'utf-8');
    expect(social).toContain('6.3787294');
    expect(social).toContain('2.4957811');
  });

  it('Footer : liens sociaux officiels visibles (TikTok, Maps ; Facebook conditionné à sa confirmation)', async () => {
    const source = await readFile('src/components/public/layout/Footer.tsx', 'utf-8');
    expect(source).toContain('TIKTOK_URL');
    expect(source).toContain('GOOGLE_MAPS_SHORT_URL');
    expect(source).toContain('Nous trouver sur Google Maps');
    expect(source).toContain('FACEBOOK_URL ? (');
    expect(source).toContain('aria-label="TikTok officiel Perscadors (@perscadors)"');
  });

  it('métadonnées : Perscadors présent dans le titre de secours, la description et le nom de site', async () => {
    const layout = await readFile('src/app/layout.tsx', 'utf-8');
    expect(layout).toContain("FALLBACK_TITLE = 'Perscadors — HP Collection | Streetwear à Cotonou, Bénin'");
    expect(layout).toContain('Perscadors — HP Collection Bénin');
    const seo = await readFile('src/lib/seoMetadata.ts', 'utf-8');
    expect(seo).toContain("SEO_SITE_NAME = 'Perscadors — HP Collection Bénin'");
  });

  it('H1 home : contexte Perscadors pour les moteurs (sr-only, sans changement visuel)', async () => {
    const source = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(source).toContain('sr-only');
    expect(source).toContain('Perscadors, la boutique streetwear HP Collection à Cotonou, Bénin');
  });

  it('IndexNow : clé publique servie + script de soumission + commande npm', async () => {
    const files = readdirSync('public');
    const keyFiles = files.filter((f) => /^[a-f0-9]{32}\.txt$/.test(f));
    expect(keyFiles.length).toBe(1);
    const key = keyFiles[0].replace('.txt', '');
    const content = await readFile(`public/${keyFiles[0]}`, 'utf-8');
    expect(content.trim()).toBe(key);
    const script = await readFile('scripts/indexnow-submit.mjs', 'utf-8');
    expect(script).toContain('api.indexnow.org/indexnow');
    expect(script).toContain('sitemap.xml');
    const pkg = await readFile('package.json', 'utf-8');
    expect(pkg).toContain('"seo:indexnow": "node scripts/indexnow-submit.mjs"');
  });
});

describe('Unit — MISSION SEO V1 (31/10) : garde-railles des correctifs on-site', () => {
  it('layout racine : plus de canonical codé en dur (une seule source : les métadonnées)', async () => {
    const source = await readFile('src/app/layout.tsx', 'utf-8');
    expect(source).not.toContain('<link rel="canonical"');
    expect(source).toContain("alternates: { canonical: '/' }");
  });

  it('page catégorie : rendue dynamiquement (pas de sous-arbre suspendu vide) + redirection permanente + fil d’Ariane', async () => {
    const source = await readFile('src/app/categorie/[slug]/page.tsx', 'utf-8');
    expect(source).not.toContain('Suspense');
    expect(source).not.toContain('fallback={null}');
    expect(source).toContain('permanentRedirect');
    expect(source).toContain("'@type': 'BreadcrumbList'");
  });

  it('page produit : vrai 404 (notFound) pour un produit inexistant + fil d’Ariane', async () => {
    const source = await readFile('src/app/produit/[id]/page.tsx', 'utf-8');
    expect(source).toContain('notFound()');
    expect(source).toContain("'@type': 'BreadcrumbList'");
  });

  it('REGRESSION main : src/app/loading.tsx racine doit rester ABSENT (sinon le 404 redevient un soft-404 200)', async () => {
    // Découvert le 07/11 : le commit 23933bd contenait les DEUX loading.tsx
    // (racine + order/[token]) — le skeleton racine flushait le shell et
    // neutralisait le statut 404. La suppression de la racine est obligatoire.
    expect(existsSync('src/app/loading.tsx')).toBe(false);
  });

  it('sitemap : aucune URL à fragment (les dièses sont ignorés par les moteurs)', async () => {
    const source = await readFile('src/app/sitemap.ts', 'utf-8');
    expect(source).not.toContain('looks#');
    expect(source).not.toContain('#${outfit.id}');
  });

  it('page 404 brandée : noindex + sorties utiles (accueil, collections)', async () => {
    const source = await readFile('src/app/not-found.tsx', 'utf-8');
    expect(source).toContain('index: false');
    expect(source).toContain('Page introuvable');
  });
});
