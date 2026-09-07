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
    // Cibler une carte dont le centre est DANS le viewport : en production,
    // l'hydratation est immédiate et l'auto-scroll (80 px/s) déplace déjà la
    // première carte hors écran pendant les délais d'attente — cliquer son
    // centre historique partirait à côté du viewport (clic dans le vide).
    const cartes = section.locator('img[alt*="Look #"]');
    const nbCartes = await cartes.count();
    const vw = page.viewportSize()?.width ?? 1280;
    const vh = page.viewportSize()?.height ?? 900;
    let box0: { x: number; y: number; width: number; height: number } | null = null;
    for (let i = 0; i < nbCartes; i += 1) {
      const bx = await cartes.nth(i).boundingBox().catch(() => null);
      if (bx && bx.x + bx.width / 2 >= 24 && bx.x + bx.width / 2 <= vw - 24 && bx.y + bx.height / 2 >= 24 && bx.y + bx.height / 2 <= vh - 24) {
        box0 = bx;
        break;
      }
    }
    if (!box0) throw new Error('aucune carte cliquable dans le viewport');
    // le survol met l'auto-scroll en pause (onMouseEnter du track) : la piste
    // devient alors stable. NB: locator.hover() vérifie la stabilité AVANT de
    // bouger la souris (impasse) — déplacement manuel comme un visiteur.
    // C'est précisément le parcours que la capture de pointeur au pointerdown
    // rendait impossible avant le correctif E1.
    await page.mouse.move(box0.x + box0.width / 2, box0.y + box0.height / 2);
    await page.waitForTimeout(1000);
    // clic 100 % souris au centre recalculé après pause de l'auto-scroll :
    // mousedown/pointerdown réels sur la carte, comme un visiteur.
    const apresPause = await page.evaluate(([cx, cy]) => { const el = document.elementFromPoint(cx, cy); return el ? el.getAttribute('alt') || el.tagName : null; }, [box0.x + box0.width / 2, box0.y + box0.height / 2]);
    if (!apresPause || !String(apresPause).includes('Look #')) {
      // la carte a dérivé avant la pause : on recentre une fois sur l'élément
      // réellement présent sous le curseur (la piste est en pause depuis le hover).
      const sousCurseur = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('#carousel-outfits img'));
        for (const img of imgs) {
          const r = img.getBoundingClientRect();
          if (r.x + r.width / 2 >= 24 && r.x + r.width / 2 <= window.innerWidth - 24) return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        }
        return null;
      });
      if (sousCurseur) await page.mouse.move(sousCurseur.x, sousCurseur.y);
      await page.waitForTimeout(400);
    }
    const finale = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('#carousel-outfits img'));
      for (const img of imgs) {
        const r = img.getBoundingClientRect();
        if (r.x + r.width / 2 >= 24 && r.x + r.width / 2 <= window.innerWidth - 24 && r.y + r.height / 2 >= 24 && r.y + r.height / 2 <= window.innerHeight - 24) {
          return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        }
      }
      return null;
    });
    if (!finale) throw new Error('aucune carte cliquable après pause');
    await page.mouse.click(finale.x, finale.y);
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
test.describe('E1-bis — LookModal utilisable quelle que soit la hauteur', () => {
  test('viewport réduit : les CTA restent atteignables (panneau scrollable)', async ({ page }) => {
    // Régression signalée en prod : avec md:overflow-visible + max-h-[90vh],
    // le contenu peignait HORS du panneau sans aucun scroll possible (boutons
    // inaccessibles, page « figée »). Le panneau doit scroller à toute taille.
    await page.setViewportSize({ width: 1280, height: 600 });
    await page.goto('/');
    const section = page.locator('#carousel-outfits');
    await section.waitFor({ state: 'attached', timeout: 20000 });
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    const imgs = section.locator('img[alt*="Look #"]');
    const n = await imgs.count();
    for (let i = 0; i < n; i += 1) {
      const bx = await imgs.nth(i).boundingBox().catch(() => null);
      if (bx && bx.x < 1240 && bx.x + 40 > 0 && bx.y < 560 && bx.y + 40 > 0) {
        const cx = Math.min(Math.max(bx.x + bx.width / 2, 8), 1272);
        const cy = Math.min(Math.max(bx.y + bx.height / 2, 8), 592);
        await page.mouse.move(cx, cy);
        await page.waitForTimeout(900);
        await page.mouse.click(cx, cy);
        break;
      }
    }
    const dlg = page.locator('[role="dialog"]').first();
    await expect(dlg).toBeVisible({ timeout: 10000 });
    // Le bouton WhatsApp doit être atteignable : le panneau l'amène au doigt.
    const cta = dlg.getByRole('button', { name: /Demander sur WhatsApp/i });
    await cta.scrollIntoViewIfNeeded();
    const box = await cta.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(600);
    // et la fermeture reste possible (non figé).
    await dlg.getByRole('button', { name: /Fermer/i }).click();
    await expect(page.locator('[role="dialog"]')).toHaveCount(0);
  });
});
