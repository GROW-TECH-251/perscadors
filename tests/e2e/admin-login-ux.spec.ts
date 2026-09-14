import { test, expect } from '@playwright/test';

// E8 — login admin UX : bandeau session, garde-fou de soumission, 429 + compte
// à rebours. Le script Turnstile est intercepté par un faux déterministe : aucun
// défi réel, aucun appel Cloudflare, comportement identique en sandbox (clé de
// test au build) et sur la machine développeur (vraie clé interceptée aussi).

const FAKE_TURNSTILE_NEVER = 'window.turnstile = { render: () => "wid-e8", remove: () => {}, reset: () => {} };';

const FAKE_TURNSTILE_TOKEN = [
  'window.turnstile = {',
  '  render: (element, options) => {',
  '    window.__e8Options = options;',
  '    setTimeout(() => options.callback("fake-turnstile-token-e8"), 50);',
  '    return "wid-e8";',
  '  },',
  '  remove: () => {},',
  '  reset: () => {',
  '    setTimeout(() => window.__e8Options && window.__e8Options.callback("fake-turnstile-token-e8b"), 50);',
  '  }',
  '};'
].join('\n');

test.describe('E2E — login admin UX (E8)', () => {
  test('bandeau session — arrivée avec ?redirect=/admin affiche le message de session', async ({ page }) => {
    await page.goto('/admin/login?redirect=/admin/produits');
    await expect(page.getByText('Votre session a expiré ou a été fermée.')).toBeVisible();
  });

  test('garde-fou — « Se connecter » désactivé sans token anti-bot', async ({ page }) => {
    await page.route('**/challenges.cloudflare.com/**', (route) =>
      route.fulfill({ contentType: 'application/javascript', body: FAKE_TURNSTILE_NEVER }));
    await page.goto('/admin/login');
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeDisabled();
  });

  test('429 — « Trop de tentatives » + compte à rebours MM:SS + bouton bloqué', async ({ page }) => {
    await page.route('**/challenges.cloudflare.com/**', (route) =>
      route.fulfill({ contentType: 'application/javascript', body: FAKE_TURNSTILE_TOKEN }));
    await page.route('**/api/auth/admin-login', (route) =>
      route.fulfill({
        status: 429,
        contentType: 'application/json',
        headers: { 'Retry-After': '119' },
        body: JSON.stringify({
          ok: false,
          message: 'Trop de tentatives de connexion. Pour protéger votre compte, les nouvelles tentatives sont temporairement bloquées. Veuillez patienter quelques minutes avant de réessayer.'
        })
      }));
    await page.goto('/admin/login');

    // Sans clé de site dans ce build, le widget n'est pas rendu : skip explicite
    // (même convention que les spéc vidéo dépendant de l'environnement).
    // On attend d'abord le rendu (widget OU message d'indisponibilité) : un
    // count() immédiat peut devancer le montage React et sauter à tort.
    await page.waitForSelector('div[aria-label="Vérification anti-bot"], p:has-text("La protection anti-bot est indisponible")', { timeout: 10000 });
    const widgetRendu = await page.locator('div[aria-label="Vérification anti-bot"]').count() > 0;
    test.skip(!widgetRendu, 'clé Turnstile absente de ce build');

    await page.fill('input[type="email"]', 'demo@exemple.com');
    await page.fill('input[type="password"]', 'MotDePasseFictif1!');
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeEnabled();
    await page.getByRole('button', { name: 'Se connecter' }).click();

    await expect(page.getByText('Trop de tentatives de connexion.')).toBeVisible();
    const compteARebours = page.getByTestId('retry-countdown');
    await expect(compteARebours).toBeVisible();
    await expect(compteARebours).toContainText(/\d{2}:\d{2}/);
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeDisabled();
  });

  test('rate limit réel — l’API renvoie 429 + Retry-After (email fictif, budget séparé)', async ({ page }) => {
    await page.goto('/admin/login');
    let statut429 = false;
    let retryAfter = '';
    for (let tentative = 0; tentative < 8 && !statut429; tentative++) {
      const reponse = await page.request.post('/api/auth/admin-login', {
        data: {
          email: 'test.ratelimit-e2e@exemple.com',
          password: 'MotDePasseFictif1!',
          captchaToken: 'x'.repeat(32)
        }
      });
      if (reponse.status() === 429) {
        statut429 = true;
        retryAfter = reponse.headers()['retry-after'] ?? '';
      }
    }
    expect(statut429).toBe(true);
    expect(Number.parseInt(retryAfter, 10)).toBeGreaterThan(0);
  });
});
