import { test, expect } from '@playwright/test';

test.describe('SEC-9 / E2E — routes de sécurité', () => {
  test('GET /api/auth/admin-login doit retourner 405', async ({ request }) => {
    const response = await request.get('/api/auth/admin-login');
    expect(response.status()).toBe(405);
  });

  test('POST /api/checkout vide doit retourner 400 ou 429', async ({ request }) => {
    const response = await request.post('/api/checkout', {
      data: {},
    });
    expect([400, 429]).toContain(response.status());
  });

  test('formulaire login doit être visible', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('form')).toBeVisible();
  });
});
