// src/lib/productAudience.ts
// ============================================
// LOT 3 (10/2026) — classification par public cible : Homme / Femme / Unisexe.
//
// Règles métier :
// - La classification d'un produit est TOUJOURS la donnée enregistrée en
//   colonne `products.target_audience` ('homme' | 'femme' | 'unisexe').
//   Aucune inférence depuis le nom, la description ou la catégorie.
// - Sur les pages catégorie : « Homme » est actif par défaut ; « Femme » est
//   une bascule. Il n'y a volontairement PAS de 3e bouton « Unisexe » : les
//   articles unisexes vivent dans les DEUX vues, une seule carte chacun
//   (jamais de doublon).
// - Comportement transitoire (migration progressive) : un produit non classé
//   (target_audience NULL, ex. catalogue existant avant classification
//   manuelle) reste visible dans les deux vues — aucun retrait silencieux.

export type ProductAudience = 'homme' | 'femme' | 'unisexe';

/** Valeur du bouton public sur les pages catégorie (pas de 3e bouton). */
export type AudienceFilter = Exclude<ProductAudience, 'unisexe'>;

export const PRODUCT_AUDIENCE_OPTIONS: Array<{ value: ProductAudience; label: string }> = [
  { value: 'homme', label: 'Homme' },
  { value: 'femme', label: 'Femme' },
  { value: 'unisexe', label: 'Unisexe' }
];

export function isProductAudience(value: unknown): value is ProductAudience {
  return value === 'homme' || value === 'femme' || value === 'unisexe';
}

/**
 * Un produit répond-il à la vue « Homme » / « Femme » ?
 * - 'unisexe' → visible dans les deux vues (une seule occurrence par vue).
 * - NULL / undefined (non classé) → visible dans les deux vues (transitoire).
 * - valeur invalide → traitée comme non classée (jamais masquée par défaut).
 */
export function matchesAudienceFilter(
  audience: ProductAudience | null | undefined,
  filter: AudienceFilter
): boolean {
  if (audience === 'unisexe' || audience == null) return true;
  return audience === filter;
}

/**
 * Filtre une liste de produits selon la vue Homme/Femme. Générique : accepte
 * tout objet portant `target_audience` (Product public, AdminProduct, mocks).
 */
export function filterProductsByAudience<T extends { target_audience?: ProductAudience | null }>(
  products: T[],
  filter: AudienceFilter
): T[] {
  return products.filter((product) => matchesAudienceFilter(product.target_audience ?? null, filter));
}
