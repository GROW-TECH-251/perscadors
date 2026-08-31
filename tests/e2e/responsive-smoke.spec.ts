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
// Chaque test a un contexte frais (localStorage vide) -> intro visible.

// Chaque test a un contexte frais (localStorage vide) -> intro visible.

// Gèle le timer d'auto-advance de l'intro (AUTO_ADVANCE_MS = 2_200 dans
// IntroStage.tsx) : les tests ne doivent pas courir contre lui. Test-only,
// aucun impact prod — le timer neutralisé n'appelle jamais son callback.
async function freezeIntroAutoAdvance(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    const original = window.setTimeout.bind(window);
    window.setTimeout = ((handler: TimerHandler, timeout?: number, ...args: unknown[]) =>
      timeout === 2200
        ? original(() => {}, 2_000_000_000)
        : original(handler, timeout, ...args)) as typeof window.setTimeout;
  });
}

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

// OV-3 — Convergence & transition : le scroll est la timeline.
test.describe('OV-3 — Convergence & transition', () => {
  test('scroll -> filigrane + logo lumineux -> hero révélé', async ({ page }) => {
    await page.goto('/?intro=1');
    await expect(page.locator('#pescador-intro')).toBeVisible();

    await page.evaluate(() => {
      const section = document.getElementById('pescador-intro');
      window.scrollTo(0, section!.offsetTop + section!.offsetHeight - window.innerHeight);
    });
    await page.waitForTimeout(600);

    const vignetteOpacity = await page
      .locator('[data-vignette]')
      .first()
      .evaluate((el) => parseFloat(el.style.opacity || '1'));
    expect(vignetteOpacity).toBeLessThanOrEqual(0.12);

    const brightness = await page.locator('[data-intro-logo]').evaluate((el) => {
      const match = (el as HTMLElement).style.filter.match(/brightness\(([\d.]+)\)/);
      return match ? parseFloat(match[1]) : 1;
    });
    expect(brightness).toBeGreaterThan(1.3);

    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.7)));
    await page.waitForTimeout(400);
    const heroVisible = await page.evaluate(() => {
      const section = document.getElementById('pescador-intro');
      let node: Element | null = section ? section.nextElementSibling : null;
      while (node && ['SCRIPT', 'NOSCRIPT', 'LINK', 'STYLE', 'TEMPLATE'].includes(node.tagName)) {
        node = node.nextElementSibling;
      }
      if (!node) return false;
      const rect = node.getBoundingClientRect();
      return rect.top < window.innerHeight * 0.7 && rect.bottom > 0;
    });
    expect(heroVisible).toBe(true);
  });

  test('Échap -> saut direct, hero visible, session marquée', async ({ page }) => {
    await page.goto('/?intro=1');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => Number(localStorage.getItem('pescador-intro-at') || 0))).toBeGreaterThan(0);
    const gone = await page.evaluate(() => {
      const section = document.getElementById('pescador-intro');
      if (!section) return true;
      return section.style.display === 'none' || section.getBoundingClientRect().bottom <= 1;
    });
    expect(gone).toBe(true);
  });

  test('fling : scroll instantané -> états finis cohérents (aucun NaN)', async ({ page }) => {
    await page.goto('/?intro=1');
    await page.evaluate(() => {
      const section = document.getElementById('pescador-intro');
      window.scrollTo(0, section!.offsetTop + section!.offsetHeight);
    });
    await page.waitForTimeout(400);
    const broken = await page.locator('[data-vignette]').first().evaluate((el) => {
      const style = el.style;
      return style.transform.includes('NaN') || Number.isNaN(parseFloat(style.opacity || '0'));
    });
    expect(broken).toBe(false);
  });
});

// FIX OV-3 — Politique reduced-motion = intro STATIQUE + ?intro=1 corrigé.
test.describe('FIX — intro statique (reduced-motion) + ?intro=1', () => {
  test('reduced-motion : intro visible et STATIQUE (aucune animation, pas d’auto-advance)', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#pescador-intro')).toBeVisible();
    await expect(page.locator('[data-intro-logo]')).toBeVisible();
    await page.waitForTimeout(3000); // au-delà de l'auto-advance (2,2 s)
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    const opacity = await page
      .locator('[data-vignette]')
      .first()
      .evaluate((el) => parseFloat(el.style.opacity || '0'));
    expect(opacity).toBeGreaterThan(0.9); // visibles immédiatement (pas de cascade)
    await context.close();
  });

  test('?intro=1 force la séquence même après une sortie (fix ordre du script inline)', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const section = document.getElementById('pescador-intro');
      window.scrollTo(0, section!.offsetTop + section!.offsetHeight);
    });
    await page.waitForTimeout(600);
    expect(await page.evaluate(() => Number(localStorage.getItem('pescador-intro-at') || 0))).toBeGreaterThan(0);
    await page.goto('/?intro=1');
    await expect(page.locator('#pescador-intro')).toBeVisible(); // gate ON malgré seen
  });
});

// OV-3c — Session utilisateur cohérente (localStorage + TTL 30 min,
// PARTAGÉE entre onglets) et composition organique vérifiable.
test.describe('OV-3c — Session cross-onglet + composition', () => {
  test('deuxième onglet de la même session navigateur -> hero direct', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const first = await context.newPage();
    await first.goto('/');
    await expect(first.locator('#pescador-intro')).toBeVisible(); // 1re vue consommée
    const second = await context.newPage(); // nouvel onglet, MÊME localStorage
    await second.goto('/');
    await expect(second.locator('#pescador-intro')).toBeHidden();
    await context.close();
  });

  test('retour > 30 min plus tard -> l\'intro revient (TTL)', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const page = await context.newPage();
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('pescador-intro-at', String(Date.now() - 31 * 60 * 1000)));
    await page.reload();
    await expect(page.locator('#pescador-intro')).toBeVisible();
    await context.close();
  });

  test('composition : hiérarchie de tailles des vignettes (3 coques)', async ({ page }) => {
    await page.goto('/?intro=1');
    // Vignettes = données catalogue hydratées côté client : on attend le
    // montage et la fin de la cascade d'entrée (≤ 860 ms + marge).
    await expect(page.locator('[data-vignette]').first()).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1500);
    // La profondeur s'écrit dans la TAILLE (width: clamp(·) ∝ scale de la
    // coque) — le scale() du transform est réservé à l'entrée/parallaxe.
    // On mesure les largeurs calculées des vignettes visibles.
    const sizes = await page.locator('[data-vignette]').evaluateAll((nodes) =>
      nodes
        .filter((node) => getComputedStyle(node).display !== 'none')
        .map((node) => Math.round(parseFloat(getComputedStyle(node).width)))
        .filter((value) => value > 0)
    );
    // 5 visibles en mobile (8 desktop). Champ organique = tailles étalées :
    // plusieurs valeurs distinctes, rapport grand/petit net (≈ 1,8 mesuré ;
    // seuil prudent 1,4 — l'uniformité serait la régression).
    expect(sizes.length).toBeGreaterThanOrEqual(4);
    expect(new Set(sizes).size).toBeGreaterThanOrEqual(3);
    expect(Math.max(...sizes) / Math.min(...sizes)).toBeGreaterThanOrEqual(1.4);
  });
});
