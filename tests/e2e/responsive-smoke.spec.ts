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
