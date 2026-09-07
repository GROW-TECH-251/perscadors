import { test, expect } from '@playwright/test';

// Consolidation 09/2026 — parcours de bout en bout :
// recherche -> no-results -> CTA « Ajouter une photo » -> parcours existant.
// Données : catalogue fallback statique (build sans env), stable.

test.describe('Consolidation — recherche & no-results', () => {
  test('E2E 1 — recherche navbar trouve un produit existant', async ({ page }) => {
    await page.goto('/looks');
    // Mobile : le champ vit derrière la loupe (aria-label dédié). Le clic peut
    // précéder l'hydratation React -> retenter SANS course de toggle : on ne
    // re-clique QUE si le champ reste caché, et on vérifie juste après
    // (l'ancien double-clic pouvait ouvrir PUIS refermer le champ).
    const loupe = page.locator('button[aria-label="Ouvrir la barre de recherche"]');
    const champ = page.locator('input[placeholder="Rechercher..."]');
    if (await loupe.isVisible()) {
      await expect(async () => {
        if (!(await champ.isVisible())) {
          await loupe.click();
        }
        await expect(champ).toBeVisible({ timeout: 1500 });
      }).toPass({ timeout: 20000 });
    }
    await champ.fill('basket');
    await champ.press('Enter');
    await page.waitForURL(/\/produit\//, { timeout: 15000 });
    expect(page.url()).toContain('/produit/');
  });
  test('E2E 8 — E4 Search UX : requête persistante navbar + écho URL + garde emojis', async ({ page }) => {
    // Écho : arrivée directe avec ?search= -> le champ navbar affiche la requête.
    await page.goto('/categorie/basket-pour-homme?search=zzzzqqqq');
    const champ = page.locator('input[placeholder="Rechercher..."]');
    const loupe = page.locator('button[aria-label="Ouvrir la barre de recherche"]');
    if (!(await champ.isVisible())) {
      await loupe.click();
      await champ.waitFor({ state: 'visible', timeout: 5000 });
    }
    await expect(champ).toHaveValue('zzzzqqqq');
    // Écho catégorie : la bannière rappelle la recherche en cours.
    await expect(page.getByText(/Résultats de recherche pour/i).first()).toBeVisible();

    // Garde emojis : une requête 100% emoji ne déclenche AUCUNE navigation.
    await champ.fill('🔥');
    await champ.press('Enter');
    await page.waitForTimeout(700);
    expect(page.url()).toContain('/categorie/basket-pour-homme');
    expect(page.url()).not.toContain('search=%F0%9F%94%A5');

    // Écho = URL : en quittant le contexte de recherche, le champ se vide.
    // (Mobile : les liens vivent dans le menu burger — l'ouvrir au besoin.)
    const lienLooks = page.getByRole('link', { name: 'HP Looks' }).first();
    if (!(await lienLooks.isVisible())) {
      await page.click('button[aria-label="Menu principal de navigation"]', { timeout: 10000 });
    }
    await lienLooks.click({ timeout: 10000 });
    await page.waitForURL(/\/looks/, { timeout: 15000 });
    await expect(champ).toHaveValue('');
  });

  test('E2E 2 — recherche inexistante -> état no-results visible', async ({ page }) => {
    await page.goto('/categorie/basket-pour-homme?search=zzzzqqqq');
    await expect(page.getByText('Aucun article ne correspond à', { exact: false })).toBeVisible({ timeout: 15000 });
  });

  test('E2E 3 — CTA « Ajouter une photo » -> modale inline avec contexte (E5)', async ({ page }) => {
    await page.goto('/categorie/basket-pour-homme?search=nike-air-max');
    // E5 (Riel) : le CTA est désormais un BOUTON inline (plus de redirection
    // vers la home ?demande=) — la modale s'ouvre sur place.
    const cta = page.getByRole('button', { name: /Ajouter une photo/i }).first();
    await expect(cta).toBeVisible({ timeout: 15000 });
    await cta.click();
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

  test('E2E 4 — mobile : parcours complet no-results -> photo (inline E5)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/categorie/basket-pour-homme?search=model-x-inexistant');
    const cta = page.getByRole('button', { name: /Ajouter une photo/i }).first();
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
