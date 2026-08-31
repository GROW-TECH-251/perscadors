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
