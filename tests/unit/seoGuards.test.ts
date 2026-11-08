import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// MISSION SEO (31/10) — garde-railles des correctifs on-site. Chaque règle
// ci-dessous protège une correction démontrée de l'audit :
// 1. AUCUN <link rel="canonical"> codé en dur dans le layout racine : c'est
//    lui qui émettait un canonical concurrent vers la homepage sur CHAQUE
//    page du site (catégories et produits déclaraient « je suis un doublon
//    de l'accueil »).
// 2. La home doit avoir son canonical via les métadonnées (alternates).
// 3. La page catégorie ne doit PAS être enveloppée dans <Suspense
//    fallback={null}> : ce wrapper figeait une coquille VIDE dans le HTML
//    prérendu (texte visible mesuré en production : 33 caractères).
// 4. La page produit doit appeler notFound() (vrai 404) pour un produit
//    inexistant — plus de soft-404 en HTTP 200.
// 5. Le sitemap ne doit contenir AUCUNE URL à fragment (/looks#N).
// 6. Le JSON-LD Store relie explicitement la marque aux noms « Perscadors ».

describe('Unit — MISSION SEO : garde-railles des correctifs on-site', () => {
  it('layout racine : plus de canonical codé en dur (une seule source : les métadonnées)', async () => {
    const source = await readFile('src/app/layout.tsx', 'utf-8');
    expect(source).not.toContain('<link rel="canonical"');
    expect(source).toContain("alternates: { canonical: '/' }");
  });

  it('page catégorie : rendue dynamiquement (pas de Suspense vide) + redirection permanente E9 + fil d’Ariane', async () => {
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

  it('sitemap : aucune URL à fragment (les fragments # sont ignorés par les moteurs)', async () => {
    const source = await readFile('src/app/sitemap.ts', 'utf-8');
    expect(source).not.toContain('looks#');
    expect(source).not.toContain('#${outfit.id}');
  });

  it('JSON-LD Store : la marque est reliée à « Perscadors » (requêtes de marque)', async () => {
    const source = await readFile('src/app/page.tsx', 'utf-8');
    expect(source).toContain('"alternateName": ["Perscadors", "HP Collection Bénin"]');
  });

  it('H1 de la home : contexte de marque présent pour les lecteurs d’écran (sr-only, sans changement visuel)', async () => {
    const source = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(source).toContain('sr-only');
    expect(source).toContain('Boutique streetwear HP Collection à Cotonou, Bénin');
  });

  it('page 404 brandée : noindex + sorties utiles (accueil, collections)', async () => {
    const source = await readFile('src/app/not-found.tsx', 'utf-8');
    expect(source).toContain('index: false');
    expect(source).toContain('Page introuvable');
  });
});
