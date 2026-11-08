import { test, expect } from '@playwright/test';

// MISSION SEO (31/10) — validation du HTML SERVEUR (ce que voit un robot sans
// JavaScript). On lit le corps de la réponse AVANT toute exécution JS.

test.describe('SEO — HTML serveur', () => {
  test('Home : exactement UN canonical, auto-référencé', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);
    const html = await response!.text();
    // Un seul canonical, auto-référencé (Next normalise sans slash final).
    expect((html.match(/rel="canonical"/g) || []).length).toBe(1);
    expect(html).toContain('rel="canonical" href="https://perscadors.vercel.app"/>');
  });

  test('Catégorie : UN canonical, H1 et cartes produits DANS le HTML initial (plus de coquille vide)', async ({ page }) => {
    const response = await page.goto('/categorie/basket-pour-homme');
    expect(response?.status()).toBe(200);
    const html = await response!.text();

    // Un seul canonical, auto-référencé (avant : deux, dont un vers la home).
    expect((html.match(/rel="canonical"/g) || []).length).toBe(1);
    expect(html).toContain('rel="canonical" href="https://perscadors.vercel.app/categorie/basket-pour-homme"');

    // Contenu réel dans le HTML initial (avant : 33 caractères visibles).
    expect(html).toMatch(/<h1[^>]*>[^<]*basket/i);
    expect(html).toContain('Détails'); // cartes produit

    // Fil d'Ariane structuré.
    expect(html).toContain('"@type":"BreadcrumbList"');
  });

  test('Produit : UN canonical + JSON-LD Product et BreadcrumbList dans le HTML initial', async ({ page }) => {
    const response = await page.goto('/produit/1');
    expect(response?.status()).toBe(200);
    const html = await response!.text();
    expect((html.match(/rel="canonical"/g) || []).length).toBe(1);
    expect(html).toContain('rel="canonical" href="https://perscadors.vercel.app/produit/1"');
    expect(html).toContain('"@type":"Product"');
    expect(html).toContain('"@type":"BreadcrumbList"');
  });

  test('Produit inexistant : vraie erreur 404 (plus de soft-404 en 200)', async ({ page }) => {
    const response = await page.goto('/produit/999999');
    expect(response?.status()).toBe(404);
    const html = await response!.text();
    expect(html).toContain('Page introuvable');
  });

  test('Sitemap : aucune URL à fragment', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const xml = await response.text();
    expect(xml).not.toContain('#');
    // Les pages principales restent présentes.
    expect(xml).toContain('https://perscadors.vercel.app/categorie/basket-pour-homme');
    expect(xml).toContain('https://perscadors.vercel.app/looks');
  });

  test('robots.txt : exploration autorisée, admin interdit, sitemap déclaré', async ({ request }) => {
    const response = await request.get('/robots.txt');
    expect(response.status()).toBe(200);
    const txt = await response.text();
    expect(txt).toContain('Allow: /');
    expect(txt).toContain('Disallow: /admin');
    expect(txt).toContain('Sitemap: https://perscadors.vercel.app/sitemap.xml');
  });
});
