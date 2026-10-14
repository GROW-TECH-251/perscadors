// src/lib/publicCategoryOrder.ts
// P1-1B/1C (finalisation 10/2026) — ordre public des catégories : la position
// définie dans l'admin (1 = première affichée) fait foi. Le snapshot public
// arrive déjà trié par position (publicCatalogService), mais cette garde rend
// le tri explicite et testable au niveau de l'affichage.

import type { CatalogCategory } from '@/types';

/** Nombre de catégories mises en avant sur la grille d'accueil (1B). */
export const HOME_CATEGORY_LIMIT = 8;

function positionOf(category: CatalogCategory): number {
  return typeof category.position === 'number' && Number.isFinite(category.position)
    ? category.position
    : Number.MAX_SAFE_INTEGER;
}

/**
 * Tri stable par position admin croissante. Les catégories sans position
 * (catalogue de repli sans base) restent en fin de liste, dans leur ordre
 * d'origine. Le tableau d'entrée n'est pas muté.
 */
export function sortCategoriesByPosition(categories: CatalogCategory[]): CatalogCategory[] {
  return [...categories]
    .map((category, index) => ({ category, index }))
    .sort(
      (left, right) =>
        positionOf(left.category) - positionOf(right.category) || left.index - right.index
    )
    .map((entry) => entry.category);
}

/**
 * Sélection de la grille d'accueil (1B) : les HOME_CATEGORY_LIMIT premières
 * catégories selon l'ordre admin (tri par position puis découpe). Les
 * suivantes restent accessibles via la page /categories (1C).
 */
export function selectHomeCategories(categories: CatalogCategory[]): CatalogCategory[] {
  return sortCategoriesByPosition(categories).slice(0, HOME_CATEGORY_LIMIT);
}
