import { test, expect } from '@playwright/test';

// Consolidation 09/2026 — parcours de bout en bout :
// recherche -> no-results -> CTA « Ajouter une photo » -> parcours existant.
// Données : catalogue fallback statique (build sans env), stable.

test.describe('Consolidation — recherche & no-results', () => {
  test('E2E 1 — recherche navbar trouve un produit existant', async ({ page }) => {
    await page.goto('/looks');
    // Mobile : le champ vit derrière la loupe (aria-label dédié). Le clic peut
    // précéder l'hydratation React au tout premier chargement -> retenter.
    const loupe = page.locator('button[aria-label="Ouvrir la barre de recherche"]');
    const champ = 'input[placeholder="Rechercher..."]';
    if (await loupe.isVisible()) {
      await loupe.click();
      try {
        await page.waitForSelector(champ, { state: 'visible', timeout: 3000 });
      } catch {
        await loupe.click();
      }
    }
    await page.waitForSelector(champ, { state: 'visible' });
    await page.fill('input[placeholder="Rechercher..."]', 'basket');
    await page.press('input[placeholder="Rechercher..."]', 'Enter');
    await page.waitForURL(/\/produit\//, { timeout: 15000 });
    expect(page.url()).toContain('/produit/');
  });

  test('E2E 2 — recherche inexistante -> état no-results visible', async ({ page }) => {
    await page.goto('/categorie/basket-pour-homme?search=zzzzqqqq');
    await expect(page.getByText('Aucun article ne correspond à', { exact: false })).toBeVisible({ timeout: 15000 });
  });

  test('E2E 3 — CTA « Ajouter une photo » -> parcours existant avec contexte', async ({ page }) => {
    await page.goto('/categorie/basket-pour-homme?search=nike-air-max');
    const cta = page.getByRole('link', { name: /Ajouter une photo/i });
    await expect(cta).toBeVisible({ timeout: 15000 });
    await cta.click();
    await page.waitForURL(/demande=nike-air-max/, { timeout: 15000 });
    // La modale existante s'ouvre (parcours unique, pas de nouvelle page).
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 });
    // La recherche initiale est transmise en RÉFÉRENCE (valeur du champ, §20).
    const champs = page.getByRole('dialog').locator('input');
    await expect
      .poll(async () => {
        const n = await champs.count();
        for (let k = 0; k < n; k += 1) {
          const valeur = await champs.nth(k).inputValue();
          if (valeur.includes('nike-air-max')) return true;
        }
        return false;
      }, { timeout: 10000 })
      .toBe(true);
  });

  test('E2E 4 — mobile : parcours complet no-results -> photo', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/categorie/basket-pour-homme?search=model-x-inexistant');
    const cta = page.getByRole('link', { name: /Ajouter une photo/i });
    await expect(cta).toBeVisible({ timeout: 15000 });
    const box = await cta.boundingBox();
    expect(box && box.height).toBeGreaterThanOrEqual(44); // tactile
    await cta.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15000 });
  });

  test('E2E 5 — mobile : recherche catégorie (filtre normalisé)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/categorie/basket-pour-homme?search=basket');
    await page.waitForTimeout(800);
    const cards = page.locator('a[href*="/produit/"]');
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('E2E 6 — mobile : navigation publique principale', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForTimeout(1500);
    // Comme un vrai utilisateur : la navbar n'apparaît qu'après le hero
    // (feature narration — navbar hors intro+hero, inert volontaire).
    await page.evaluate(() => window.scrollTo(0, 4000));
    await page.waitForTimeout(1200);
    // menu mobile : bouton dédié (aria-label) -> lien catégorie -> navigation
    await page.click('button[aria-label="Menu principal de navigation"]', { timeout: 10000 });
    const lien = page.locator('a[href*="/categorie/"]:visible').first();
    await lien.click({ timeout: 10000 });
    await page.waitForURL(/\/categorie\//, { timeout: 15000 });
    expect(page.url()).toContain('/categorie/');
  });

  test('E2E 7 — mobile : entrée admin utilisable (login)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/admin/login');
    await expect(page.locator('form')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('form button[type="submit"]')).toBeVisible();
  });
});
