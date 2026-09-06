import { test, expect } from '@playwright/test';

// Phase finale 09/2026 (E1) — HP inspection, parcours RÉELS :
// /looks = cartes inline (pièces listées + liens) ; home = carrousel -> LookModal.
// Données du build sans env : looks statiques AVEC pièces reliées (ex. Look #1
// -> produit 6) ; l'état « sans pièces » est couvert par les gardes unitaires.

test.describe('E1 — HP inspection (page /looks)', () => {
  test('une carte HP liste ses pièces avec liens vers les fiches produit', async ({ page }) => {
    await page.goto('/looks');
    const piece = page.locator('a[href^="/produit/"]').first();
    await expect(piece).toBeVisible({ timeout: 20000 });
    await expect(page.getByText('Pièces de cet outfit :').first()).toBeVisible();
  });

  test('clic sur une pièce -> la fiche produit s’ouvre (inspection réelle)', async ({ page }) => {
    await page.goto('/looks');
    const piece = page.locator('a[href^="/produit/"]').first();
    await piece.waitFor({ state: 'visible', timeout: 20000 });
    await piece.click();
    await page.waitForURL(/\/produit\//, { timeout: 15000 });
    expect(page.url()).toContain('/produit/');
  });

  test('chaque carte garde une issue WhatsApp (« Recréer ce look »)', async ({ page }) => {
    await page.goto('/looks');
    const recreer = page.getByRole('button', { name: /Recréer ce look/i }).first();
    await expect(recreer).toBeVisible({ timeout: 20000 });
  });
});

test.describe('E1 — HP inspection (carrousel home -> LookModal)', () => {
  test('clic souris sur un HP du carrousel ouvre la modale d’inspection', async ({ page }) => {
    await page.goto('/');
    // viser directement la section carrousel (les vignettes d'intro portent
    // des alts « Look #N » identiques mais ne sont pas cliquables)
    const section = page.locator('#carousel-outfits');
    await section.waitFor({ state: 'attached', timeout: 20000 });
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const carte = section.locator('img[alt*="Look #"]').first();
    await carte.waitFor({ state: 'visible', timeout: 20000 });
    // le survol met l'auto-scroll en pause (onMouseEnter du track) : l'élément
    // devient alors stable. NB: locator.hover() vérifie la stabilité AVANT de
    // bouger la souris (impasse) — on déplace donc la souris manuellement,
    // exactement comme le ferait un visiteur, puis on clique pour de vrai.
    // C'est précisément le parcours que la capture de pointeur au pointerdown
    // rendait impossible avant le correctif.
    const box0 = await carte.boundingBox();
    if (!box0) throw new Error('carte hors viewport');
    await page.mouse.move(box0.x + box0.width / 2, box0.y + box0.height / 2);
    await page.waitForTimeout(1000);
    // clic 100 % souris au centre recalculé après pause de l'auto-scroll :
    // mousedown/pointerdown réels sur la carte, comme un visiteur.
    const box = await carte.boundingBox();
    if (!box) throw new Error('carte hors viewport après pause');
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 10000 });
    // LookModal : « Cet outfit est composé de pièces… » (pièces reliées) ou
    // « Les pièces de ce look ne sont pas encore reliées… » (état vide E1).
    await expect(dialog).toContainText(/pièces/i);
    // inspection réelle : les pièces ouvrent leur fiche produit.
    await expect(dialog.locator('a[href^="/produit/"]').first()).toBeVisible();
  });
});

test.describe('E1 — drag-to-scroll préservé (non-régression capture)', () => {
  test('un drag horizontal fait défiler la piste sans ouvrir la modale', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('#carousel-outfits');
    await section.waitFor({ state: 'attached', timeout: 20000 });
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const carte = section.locator('img[alt*="Look #"]').first();
    await carte.waitFor({ state: 'visible', timeout: 20000 });
    const box = await carte.boundingBox();
    if (!box) throw new Error('carte hors viewport');
    const track = section.locator('.outfit-carousel-track');
    const before = await track.evaluate((el) => el.scrollLeft);
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.waitForTimeout(300);
    await page.mouse.down();
    for (let i = 1; i <= 8; i += 1) {
      await page.mouse.move(cx - i * 25, cy, { steps: 4 });
    }
    await page.mouse.up();
    await page.waitForTimeout(800);
    const after = await track.evaluate((el) => el.scrollLeft);
    // la piste a défilé (drag bien capturé au-delà du seuil)...
    expect(Math.abs(after - before)).toBeGreaterThan(20);
    // ...et le drag n'a pas ouvert la LookModal.
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });
});