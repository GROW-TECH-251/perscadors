import { test, expect } from '@playwright/test';

// DERNIÈRE IMPLÉMENTATION — Narration Intro → Hero → Header (desktop + mobile).
// 1. Pendant l'intro : AUCUNE navbar (elle est hors flux, invisible dès le
//    premier paint — règle :has) ; la bulle WhatsApp est masquée.
// 2. À la sortie de l'intro : le hero remplit EXACTEMENT le viewport
//    (barre narrative comprise) et la navbar reste invisible.
// 3. Le hero entièrement dépassé : la navbar réapparaît en overlay fixe
//    (aucun déplacement de contenu). Remontée dans le hero : elle se retire.
// Déterministe : position réelle du hero, aucun timer.

const navHidden = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const nav = document.querySelector('.pescador-navbar');
    if (!nav) return false;
    const rect = nav.getBoundingClientRect();
    const style = getComputedStyle(nav);
    return rect.bottom <= 1 || style.pointerEvents === 'none';
  });

const heroRect = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const hero = document.getElementById('pescador-hero')!;
    const r = hero.getBoundingClientRect();
    return {
      top: Math.round(r.top),
      bottom: Math.round(r.bottom),
      viewport: window.innerHeight,
      width: Math.round(r.width),
      docWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    };
  });

const scrollToHero = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const hero = document.getElementById('pescador-hero')!;
    window.scrollTo({ top: hero.getBoundingClientRect().top + window.scrollY, behavior: 'instant' as ScrollBehavior });
  });

const scrollPastHero = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const hero = document.getElementById('pescador-hero')!;
    const top = hero.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + hero.offsetHeight + 40, behavior: 'instant' as ScrollBehavior });
  });

test.describe('Dernière implémentation — navbar / hero / narration', () => {
  test('intro : navbar invisible, hero plein viewport sans navbar, navbar visible après le hero', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#pescador-intro')).toBeVisible();

    // 1. Pendant l'intro : pas de navbar, pas de bulle WhatsApp.
    await expect.poll(() => navHidden(page)).toBe(true);
    const waHidden = await page.evaluate(() => {
      const wa = document.querySelector('.pescador-whatsapp-float');
      if (!wa) return true;
      return getComputedStyle(wa).opacity === '0';
    });
    expect(waHidden).toBe(true);

    // 2. Sortie de l'intro : le hero remplit exactement le viewport.
    await scrollToHero(page);
    await expect.poll(() => navHidden(page)).toBe(true);
    const r = await heroRect(page);
    expect(r.top).toBeLessThanOrEqual(1);
    expect(r.bottom).toBeGreaterThanOrEqual(r.viewport - 1);

    // 3. Hero entièrement dépassé : la navbar réapparaît (overlay, sans
    //    déplacement de contenu).
    await scrollPastHero(page);
    await expect.poll(() => navHidden(page)).toBe(false);
    // Le retour de la navbar est une transition (tokens motion, ~400 ms,
    // 0 ms en reduced-motion) : on attend la fin du glissement avant de
    // mesurer sa position finale.
    await page.waitForTimeout(600);
    const navBox = await page.evaluate(() => {
      const nav = document.querySelector('.pescador-navbar')!;
      const rect = nav.getBoundingClientRect();
      return { top: Math.round(rect.top), position: getComputedStyle(nav).position };
    });
    expect(navBox.top).toBeGreaterThanOrEqual(-1);
    expect(navBox.position).toBe('fixed');

    // 4. Remontée dans le hero : la navbar se retire à nouveau.
    await scrollToHero(page);
    await expect.poll(() => navHidden(page)).toBe(true);
  });

  test('?intro=0 : hero plein écran dès l’arrivée, navbar après le hero seulement', async ({ page }) => {
    await page.goto('/?intro=0');
    await page.waitForTimeout(400);
    await expect.poll(() => navHidden(page)).toBe(true);
    const r = await heroRect(page);
    expect(r.top).toBeLessThanOrEqual(1);
    expect(r.bottom).toBeGreaterThanOrEqual(r.viewport - 1);
    await scrollPastHero(page);
    await expect.poll(() => navHidden(page)).toBe(false);
  });

  test('non-régression : /looks garde sa navbar sticky dès le chargement', async ({ page }) => {
    await page.goto('/looks');
    await page.waitForTimeout(400);
    await expect.poll(() => navHidden(page)).toBe(false);
    const position = await page.evaluate(() => getComputedStyle(document.querySelector('.pescador-navbar')!).position);
    expect(position).toBe('sticky');
  });

  test('aucun débordement horizontal, home intro et hero', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(300);
    let r = await heroRect(page);
    expect(r.scrollWidth).toBeLessThanOrEqual(r.docWidth);
    await scrollToHero(page);
    await page.waitForTimeout(300);
    r = await heroRect(page);
    expect(r.scrollWidth).toBeLessThanOrEqual(r.docWidth);
  });
});

test.describe('Dernière implémentation — reduced-motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } as never });

  test('reduced-motion : comportement navbar identique (statique, sans auto-scroll)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#pescador-intro')).toBeVisible();
    await expect.poll(() => navHidden(page)).toBe(true);
    // La page ne bouge jamais seule (scrollY 0 tant que l'utilisateur
    // n'a pas scrollé).
    const scrollY = await page.evaluate(() => Math.round(window.scrollY));
    expect(scrollY).toBe(0);
    await scrollPastHero(page);
    await expect.poll(() => navHidden(page)).toBe(false);
  });
});
