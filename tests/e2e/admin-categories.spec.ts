import { test, expect } from '@playwright/test';

// E9 — gestion des catégories : gardes publiques. La matrice complète
// (création/renommage/suppression avec transfert vers « Autres ») s'exécute
// sur la base réelle depuis le Dashboard (procédure du rapport E9) : la
// sandbox n'a pas accès à la base Supabase du projet. Ces tests verrouillent
// les comportements publics et la garde admin côté E2E.

test.describe('E2E — catégories (E9)', () => {
  test('page publique /categorie/[slug] reste fonctionnelle (régression)', async ({ page }) => {
    const reponse = await page.goto('/categorie/basket-pour-homme');
    expect(reponse?.status()).toBe(200);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('slug inconnu : aucune redirection fantôme, la page reste atteignable', async ({ page }) => {
    await page.goto('/categorie/slug-inconnu-e9');
    // Pas de catégorie courante ni d'ancien slug correspondant : on doit
    // rester sur l'URL demandée (aucune redirection accidentelle).
    await expect(page).toHaveURL(/\/categorie\/slug-inconnu-e9/);
    await expect(page.locator('h1').first()).toBeVisible();
  });

  test('header public : 4 catégories dans l ordre défini + HP Looks fixe en 5e position (E10)', async ({ page }) => {
    await page.goto('/');
    const liens = page.locator('nav a.nav-link');
    await expect(liens).toHaveCount(6);
    await expect(liens.nth(0)).toHaveText('Accueil');
    // Catalogue de repli (sandbox sans base) : ordre historique 1-4.
    await expect(liens.nth(1)).toHaveText('Baskets Homme');
    await expect(liens.nth(2)).toHaveText('Complets Streetwear');
    await expect(liens.nth(3)).toHaveText('Jeans Oversize');
    await expect(liens.nth(4)).toHaveText('Tapettes & Sandales');
    // HP Look : 5e position du menu condensé, toujours en dernier.
    await expect(liens.nth(5)).toHaveText('HP Looks');
    await expect(liens.nth(5)).toHaveAttribute('href', '/looks');
    await expect(liens.nth(1)).toHaveAttribute('href', '/categorie/basket-pour-homme');
  });

  test('garde admin : /admin/produits renvoie vers le login sans session', async ({ page }) => {
    await page.goto('/admin/produits');
    await expect(page).toHaveURL(/\/admin\/login/);
  });
});
