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
// Contexte frais par test -> intro visible (OV-3d : elle se joue à
// CHAQUE chargement de document — refresh et nouvel onglet inclus).

// Contexte frais par test -> intro visible (OV-3d : elle se joue à
// CHAQUE chargement de document — refresh et nouvel onglet inclus).

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

  test('« Passer » masque l’intro ; un refresh la REJOUE (première scène à chaque document)', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /passer l'introduction/i }).click();
    await expect(page.locator('#pescador-intro')).toBeHidden();
    // OV-3d : aucun stockage — le rechargement est une NOUVELLE entrée.
    await page.reload();
    await expect(page.locator('#pescador-intro')).toBeVisible();
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
  test('vignettes présentes (6-9), delta images intro ≤ 9, zéro requête REST', async ({ browser, page }) => {
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
    // Les slots montent après hydratation du catalogue (useCatalog) :
    // on attend leur apparition avant de compter (sinon course).
    await page.waitForSelector('#pescador-intro [data-vignette]', { timeout: 15_000 });

    const vignettes = await page.locator('#pescador-intro [data-vignette]').count();
    // OV-3f : 9 slots (6 visibles en mobile, les 3 autres masqués par CSS
    // ne chargent pas leurs images). La fenêtre de mesure (1,5 s) précède
    // la première rotation (5,2 s) : budget initial inchangé par la rotation.
    expect(vignettes).toBeGreaterThanOrEqual(6);
    expect(vignettes).toBeLessThanOrEqual(9);

    expect(rest).toHaveLength(0);

    const [withIntro, withoutIntro] = await Promise.all([
      countOutfitRequests('/?intro=1'),
      countOutfitRequests('/?intro=0'),
    ]);
    expect(withIntro - withoutIntro).toBeLessThanOrEqual(9);
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
    // Attendre le montage client (vignettes = rendu post-hydratation) pour
    // que l'écouteur clavier soit actif avant Échap.
    await expect(page.locator('[data-vignette]').first()).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    expect(
      await page.evaluate(
        () => (window as unknown as { __PESCADOR_INTRO_DONE__?: number }).__PESCADOR_INTRO_DONE__
      )
    ).toBe(1); // OV-3d : mémoire du document
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
    expect(
      await page.evaluate(
        () => (window as unknown as { __PESCADOR_INTRO_DONE__?: number }).__PESCADOR_INTRO_DONE__
      )
    ).toBe(1); // OV-3d : mémoire du document
    await page.goto('/');
    await expect(page.locator('#pescador-intro')).toBeVisible(); // rejeu : nouveau document
  });
});

// OV-3d — Politique « première scène » : l'intro se rejoue à CHAQUE
// chargement de document (refresh, nouvel onglet) ; seule la navigation
// interne (soft-nav) ne la rejoue pas. Plus aucun stockage persistant.
test.describe('OV-3d — Replay par document + composition', () => {
  test('nouvel onglet -> l\'intro se rejoue (aucun stockage partagé)', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    const first = await context.newPage();
    await first.goto('/');
    await expect(first.locator('#pescador-intro')).toBeVisible();
    await first.getByRole('button', { name: /passer l'introduction/i }).click();
    await expect(first.locator('#pescador-intro')).toBeHidden();
    const second = await context.newPage(); // nouvel onglet : NOUVELLE entrée
    await second.goto('/');
    await expect(second.locator('#pescador-intro')).toBeVisible();
    await context.close();
  });

  test('soft-navigation (/ -> /looks -> /) -> PAS de rejeu', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /passer l'introduction/i }).click();
    await expect(page.locator('#pescador-intro')).toBeHidden();
    // DERNIÈRE IMPLÉMENTATION — la navbar ne fait pas partie de la
    // scène hero : on dépasse le hero pour que la navigation revienne
    // (overlay fixe) avant de cliquer ses liens.
    await page.evaluate(() => {
      const hero = document.getElementById('pescador-hero')!;
      const top = hero.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top + hero.offsetHeight + 40, behavior: 'instant' as ScrollBehavior });
    });
    await page.waitForTimeout(500);
    // Le lien HP Looks vit dans la nav (desktop) ou le burger (mobile) ;
    // plusieurs ancres /looks existent dans le DOM (footer) : on cible la
    // première VISIBLE.
    const burger = page.getByRole('button', { name: /menu principal de navigation/i });
    if (await burger.isVisible().catch(() => false)) await burger.click();
    await page.locator('a[href="/looks"]:visible').first().click();
    await page.waitForTimeout(700);
    await page.locator('a[href="/"]:visible').first().click(); // logo
    await page.waitForTimeout(900);
    // Drapeau en mémoire du document : la home revenue masque l'intro.
    await expect(page.locator('#pescador-intro')).toBeHidden();
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

    // ÉQUILIBRE ABSOLU (OV-3e — la regression « tout a gauche » etait un bug
    // d'ANCRAGE : nœuds left-0 top-0 + coordonnées centrées => constellation
    // décalée de (-w/2, -h/2), centroïde mesuré (-648, -169). On mesure
    // désormais la géométrie RÉELLE : centre de chaque vignette (rect) par
    // rapport au centre du CHAMP — indépendant du repère des transforms.
    const field = page.locator('[data-intro-field]');
    const fieldBox = await field.boundingBox();
    expect(fieldBox).not.toBeNull();
    const centres = await page.locator('[data-vignette]').evaluateAll((nodes) =>
      nodes
        .filter((node) => getComputedStyle(node).display !== 'none')
        .map((node) => {
          const rect = node.getBoundingClientRect();
          return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        })
    );
    expect(centres.length).toBeGreaterThanOrEqual(4);
    const originX = fieldBox!.x + fieldBox!.width / 2;
    const originY = fieldBox!.y + fieldBox!.height / 2;
    const rel = centres.map((c) => ({ x: c.x - originX, y: c.y - originY }));
    const meanX = rel.reduce((sum, c) => sum + c.x, 0) / rel.length;
    const meanY = rel.reduce((sum, c) => sum + c.y, 0) / rel.length;
    const maxX = Math.max(...rel.map((c) => Math.abs(c.x)));
    const maxY = Math.max(...rel.map((c) => Math.abs(c.y)));
    expect(maxX).toBeGreaterThan(150); // le champ occupe l'espace autour du logo
    expect(maxY).toBeGreaterThan(100);
    expect(Math.abs(meanX)).toBeLessThanOrEqual(maxX * 0.25);
    expect(Math.abs(meanY)).toBeLessThanOrEqual(maxY * 0.3);
    // Des deux côtés : au moins une vignette à gauche ET une à droite.
    expect(rel.some((c) => c.x < -60)).toBe(true);
    expect(rel.some((c) => c.x > 60)).toBe(true);
  });

  test('immobilité : sans interaction, la page ne bouge JAMAIS seule (règle OV-3e)', async ({ page }) => {
    await page.goto('/?intro=1');
    await page.waitForSelector('[data-vignette]', { timeout: 15_000 });
    await page.waitForTimeout(4_000); // l'ancien auto-advance déclenchait à 2,2 s
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator('#pescador-intro')).toBeVisible();
  });

  test('rotation de galerie : à l\'arrêt, les looks sont remplacés par fondu (toute la galerie vit)', async ({ page }) => {
    await page.goto('/?intro=1');
    await page.waitForSelector('[data-vignette]', { timeout: 15_000 });
    // NB : evaluate ne sérialise pas les Set — on retourne un tableau et
    // on reconstruit l'ensemble côté Node.
    const urls = () =>
      page.evaluate(() =>
        [
          ...new Set(
            [...document.querySelectorAll('#pescador-intro [data-vignette] img')]
              .map((img) => {
                const el = img as HTMLImageElement;
                return el.currentSrc || el.getAttribute('src') || '';
              })
              .filter(Boolean)
          ),
        ]
      );
    await page.waitForTimeout(2_500); // montage complet des 9 slots
    const before = new Set(await urls());
    await page.waitForTimeout(13_000); // ≥ 2 remplacements (1 par 5,2 s)
    const after = new Set(await urls());
    // La rotation remplace le CONTENU : de NOUVELLES images (absentes de
    // l'instant d'avant) sont chargées en fondu — on compare les MEMBRES,
    // pas les cardinaux (il y a toujours 9 slots).
    const nouveaux = [...after].filter((url) => !before.has(url));
    expect(nouveaux.length).toBeGreaterThanOrEqual(2);
    // Et la page n'a toujours pas bougé d'elle-même (règle OV-3e).
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.locator('#pescador-intro')).toBeVisible();
  });

  test('respiration : micro-mouvement subtil, sans révolution circulaire', async ({ page }) => {
    await page.goto('/?intro=1');
    await page.waitForSelector('[data-vignette]', { timeout: 15_000 });
    await page.waitForTimeout(1_500);
    const read = () =>
      page.locator('[data-vignette]').evaluateAll((nodes) =>
        nodes
          .filter((node) => getComputedStyle(node).display !== 'none')
          .map((node) => {
            const rect = node.getBoundingClientRect();
            return { x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2) };
          })
      );
    const a = await read();
    // Fenêtre de 3 s : précède la première rotation de galerie (~6 s après
    // le montage) — on mesure la dérive, pas un remplacement.
    await page.waitForTimeout(3_000);
    const b = await read();
    // Le champ VIT (dérive 6-30 px par axe) mais subtilement — et le
    // CENTROÏDE ne dérive pas (pas de rotation d'ensemble).
    const moved = a.map((p0, i) => Math.hypot(b[i].x - p0.x, b[i].y - p0.y));
    expect(Math.max(...moved)).toBeGreaterThan(3); // au moins une vignette dérive
    expect(Math.max(...moved)).toBeLessThan(90); // jamais une course
    const meanDX = b.reduce((sum, p1, i) => sum + (p1.x - a[i].x), 0) / b.length;
    expect(Math.abs(meanDX)).toBeLessThan(30); // pas de translation globale
  });
});
