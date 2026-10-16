import { test, expect } from '@playwright/test';

// LOT 3 (révision 16/10) — filtre public cible sur les pages catégorie,
// DÉFAUT HOMME. Homme actif par défaut à l'ouverture ; Femme en bascule ;
// pas de 3e bouton Unisexe (les articles unisexes vivent dans les deux vues,
// sans doublon). Un produit non classé est traité comme HOMME : il ne
// s'affiche plus « des deux côtés ».
// Données : catalogue fallback statique (build sans env) — produits non
// classés (target_audience absent) donc résolus HOMME : la vue Femme du
// fallback est vide (état no-results), la vue Homme montre tout.

const CATEGORIE = '/categorie/basket-pour-homme';

// Cartes produit de la grille uniquement (chaque carte porte le libellé
// « Détails » ; les suggestions « Complète le look » et les liens de
// navigation n'en ont pas).
const cartesProduit = (page: import('@playwright/test').Page) => page.getByRole('link', { name: /Détails/ });

test.describe('Filtre public cible — pages catégorie (défaut Homme)', () => {
  test('Homme actif par défaut ; vue Femme exclut les articles non classés (traités Homme)', async ({ page }) => {
    await page.goto(CATEGORIE);

    const boutonHomme = page.getByRole('button', { name: 'Homme', exact: true });
    const boutonFemme = page.getByRole('button', { name: 'Femme', exact: true });
    await expect(boutonHomme).toBeVisible({ timeout: 15000 });
    await expect(boutonFemme).toBeVisible();

    // Homme actif par défaut, Femme inactive — pas de 3e bouton Unisexe.
    await expect(boutonHomme).toHaveAttribute('aria-pressed', 'true');
    await expect(boutonFemme).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('button', { name: 'Unisexe', exact: true })).toHaveCount(0);

    // Vue Homme : le catalogue fallback (non classé → Homme) est visible.
    const apresOuverture = await cartesProduit(page).count();
    expect(apresOuverture).toBeGreaterThan(0);

    // Vue Femme : les articles non classés (traités Homme) disparaissent —
    // plus AUCUN affichage « des deux côtés » par défaut.
    await boutonFemme.click();
    await expect(boutonFemme).toHaveAttribute('aria-pressed', 'true');
    await expect(boutonHomme).toHaveAttribute('aria-pressed', 'false');
    await expect(cartesProduit(page)).toHaveCount(0);
    // État no-results spécifique (sans recherche en cours).
    await expect(page.getByText('Vous ne trouvez pas ce que vous cherchez ?', { exact: false })).toBeVisible();

    // Retour Homme : la vue initiale se rétablit intégralement.
    await boutonHomme.click();
    await expect(boutonHomme).toHaveAttribute('aria-pressed', 'true');
    expect(await cartesProduit(page).count()).toBe(apresOuverture);
  });

  test('Le compteur d’articles reflète la vue active', async ({ page }) => {
    await page.goto(CATEGORIE);

    const compteur = page.getByText(/\d+ Articles? trouvés?/);
    await expect(compteur).toBeVisible({ timeout: 15000 });
    // Attendre le rendu effectif du catalogue (sous charge, le badge démarre
    // à 0 avant hydratation — on verrouille sur la première carte).
    await expect(cartesProduit(page).first()).toBeVisible({ timeout: 15000 });

    const lireNombre = async () => {
      const texte = await compteur.first().innerText();
      const nombre = parseInt(texte.replace(/[^\d]/g, ''), 10);
      expect(Number.isFinite(nombre)).toBe(true);
      return nombre;
    };

    // Vue Homme : tout le catalogue fallback (résolu Homme).
    const nombreHomme = await lireNombre();
    expect(nombreHomme).toBeGreaterThan(0);
    expect(await cartesProduit(page).count()).toBe(nombreHomme);

    // Vue Femme : 0 article fallback (non classé ≠ unisexe) — compteur à 0.
    await page.getByRole('button', { name: 'Femme', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Femme', exact: true })).toHaveAttribute('aria-pressed', 'true');
    await expect(cartesProduit(page)).toHaveCount(0);
    const nombreFemme = await lireNombre();
    expect(nombreFemme).toBe(0);
    expect(await cartesProduit(page).count()).toBe(0);
  });
});
