import { test, expect } from '@playwright/test';

// LOT 3 (10/2026) — filtre public cible sur les pages catégorie.
// Homme actif par défaut à l'ouverture ; Femme en bascule ; pas de 3e bouton
// Unisexe (les articles unisexes vivent dans les deux vues, sans doublon).
// Données : catalogue fallback statique (build sans env) — produits non
// classés (target_audience NULL) donc attendus visibles dans les DEUX vues
// (comportement transitoire, classification manuelle progressive).

const CATEGORIE = '/categorie/basket-pour-homme';

// Cartes produit de la grille uniquement (chaque carte porte le libellé
// « Détails » ; les suggestions « Complète le look » et les liens de
// navigation n'en ont pas).
const cartesProduit = (page: import('@playwright/test').Page) => page.getByRole('link', { name: /Détails/ });

test.describe('Filtre public cible — pages catégorie', () => {
  test('Homme actif par défaut ; bascule Femme sans perte ni doublon', async ({ page }) => {
    await page.goto(CATEGORIE);

    const boutonHomme = page.getByRole('button', { name: 'Homme', exact: true });
    const boutonFemme = page.getByRole('button', { name: 'Femme', exact: true });
    await expect(boutonHomme).toBeVisible({ timeout: 15000 });
    await expect(boutonFemme).toBeVisible();

    // Homme actif par défaut, Femme inactive — pas de 3e bouton Unisexe.
    await expect(boutonHomme).toHaveAttribute('aria-pressed', 'true');
    await expect(boutonFemme).toHaveAttribute('aria-pressed', 'false');
    await expect(page.getByRole('button', { name: 'Unisexe', exact: true })).toHaveCount(0);

    // Vue Homme : le catalogue (non classé → transitoire) reste visible.
    const apresOuverture = await cartesProduit(page).count();
    expect(apresOuverture).toBeGreaterThan(0);

    // Bascule Femme : mêmes articles visibles, chacun exactement une fois.
    await boutonFemme.click();
    await expect(boutonFemme).toHaveAttribute('aria-pressed', 'true');
    await expect(boutonHomme).toHaveAttribute('aria-pressed', 'false');
    const liensFemme = await cartesProduit(page).evaluateAll((noeuds) =>
      noeuds.map((n) => (n as HTMLAnchorElement).getAttribute('href'))
    );
    expect(liensFemme.length).toBeGreaterThan(0);
    expect(new Set(liensFemme).size).toBe(liensFemme.length); // aucun doublon

    // Retour Homme : la vue initiale se rétablit.
    await boutonHomme.click();
    await expect(boutonHomme).toHaveAttribute('aria-pressed', 'true');
    expect(await cartesProduit(page).count()).toBe(apresOuverture);
  });

  test('Le compteur d’articles reflète la vue active', async ({ page }) => {
    await page.goto(CATEGORIE);

    const compteur = page.getByText(/\d+ Articles? trouvés?/);
    await expect(compteur).toBeVisible({ timeout: 15000 });

    const lireNombre = async () => {
      const texte = await compteur.first().innerText();
      const nombre = parseInt(texte.replace(/[^\d]/g, ''), 10);
      expect(Number.isFinite(nombre)).toBe(true);
      return nombre;
    };

    const nombreHomme = await lireNombre();
    expect(await cartesProduit(page).count()).toBe(nombreHomme);

    // Vue Femme (catalogue non classé → même décompte transitoire) : le
    // compteur suit la vue, la grille et le badge restent cohérents.
    await page.getByRole('button', { name: 'Femme', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Femme', exact: true })).toHaveAttribute('aria-pressed', 'true');
    const nombreFemme = await lireNombre();
    expect(await cartesProduit(page).count()).toBe(nombreFemme);
  });
});
