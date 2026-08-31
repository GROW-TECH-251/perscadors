import { test, expect } from '@playwright/test';

test.describe('SEC-9 / E2E — smoke responsive', () => {
  test('pas de débordement horizontal sur /', async ({ page }) => {
    await page.goto('/');
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewport = await page.evaluate(() => window.innerWidth);
    expect(width).toBeLessThanOrEqual(viewport + 5);
  });

  test('pas de débordement horizontal sur /looks', async ({ page }) => {
    await page.goto('/looks');
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewport = await page.evaluate(() => window.innerWidth);
    expect(width).toBeLessThanOrEqual(viewport + 5);
  });

  test('desktop chromium — navigation admin accessible', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('form')).toBeVisible();
  });

  test('mobile chromium pixel 5 — navigation sans débordement', async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 393, height: 851 },
      userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5)',
    });
    const page = await context.newPage();
    await page.goto('/');
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewport = await page.evaluate(() => window.innerWidth);
    expect(width).toBeLessThanOrEqual(viewport + 5);
    await context.close();
  });
});

// OV-1 — Fondation de l'intro HP Collection (statique, gates pré-paint).
// Chaque test a un contexte frais -> sessionStorage vide -> intro visible.
test.describe('OV-1 — Intro HP Collection', () => {
  test('intro visible au premier chargement, aucun débordement', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#pescador-intro')).toBeVisible();
    await expect(page.getByRole('button', { name: /passer l'introduction/i })).toBeVisible();
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewport = await page.evaluate(() => window.innerWidth);
    expect(width).toBeLessThanOrEqual(viewport + 5);
  });

  test('« Passer » masque l’intro et la mémorise pour la session', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /passer l'introduction/i }).click();
    await expect(page.locator('#pescador-intro')).toBeHidden();
    await page.reload();
    await expect(page.locator('#pescador-intro')).toBeHidden();
  });

  test('?intro=0 désactive la section (gate pré-paint)', async ({ page }) => {
    await page.goto('/?intro=0');
    await expect(page.locator('#pescador-intro')).toBeHidden();
  });
});

// OV-2 — Champ organique : vignettes déterministes, budget média, zéro REST.
// Attribution par DELTA : la home charge déjà des images looks (carousel HP
// LOOKS, eager IMP-06). On compare « avec intro » vs « sans intro (?intro=0) »
// dans des contextes frais : le delta = le coût propre de l'intro (≤ 8).
test.describe('OV-2 — Champ organique', () => {
  test('vignettes présentes (5-8), delta images intro ≤ 8, zéro requête REST', async ({ browser, page }) => {
    const countOutfitRequests = async (url: string) => {
      const context = await browser.newContext();
      const p = await context.newPage();
      const outfitImages: string[] = [];
      p.on('request', (request) => {
        const requestUrl = request.url();
        if (decodeURIComponent(requestUrl).includes('/collections/outfits/')) {
          outfitImages.push(requestUrl);
        }
      });
      await p.goto(url);
      await p.waitForTimeout(1500); // cascade d'entrée + eager/lazy
      await context.close();
      return outfitImages.length;
    };

    const rest: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/rest/v1/')) rest.push(request.url());
    });
    await page.goto('/');
    await expect(page.locator('#pescador-intro')).toBeVisible();

    const vignettes = await page.locator('#pescador-intro [data-vignette]').count();
    expect(vignettes).toBeGreaterThanOrEqual(5);
    expect(vignettes).toBeLessThanOrEqual(8);

    expect(rest).toHaveLength(0);

    const [withIntro, withoutIntro] = await Promise.all([
      countOutfitRequests('/?intro=1'),
      countOutfitRequests('/?intro=0'),
    ]);
    expect(withIntro - withoutIntro).toBeLessThanOrEqual(8);
    expect(withIntro).toBeGreaterThanOrEqual(withoutIntro);
  });
});
