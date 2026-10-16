// src/lib/productAudience.ts
// ============================================
// LOT 3 (10/2026, révision 16/10) — classification par public cible :
// Homme / Femme / Unisexe.
//
// Règles métier (décision propriétaire 16/10) :
// - La classification d'un produit est TOUJOURS la donnée enregistrée en
//   colonne `products.target_audience` ('homme' | 'femme' | 'unisexe').
//   Aucune inférence depuis le nom, la description ou la catégorie.
// - DÉFAUT = HOMME : un produit non classé (NULL/absent — ex. ligne
//   antérieure à la migration, catalogue de repli) est traité comme un
//   produit HOMME. Il ne s'affiche PLUS « des deux côtés » : uniquement en
//   vue Homme. (La migration passe la colonne en défaut 'homme' NOT NULL.)
// - Sur les pages catégorie : « Homme » actif par défaut ; « Femme » en
//   bascule. Pas de 3e bouton Unisexe : les articles unisexes vivent dans
//   les DEUX vues, une seule carte chacun (jamais de doublon).

export type ProductAudience = 'homme' | 'femme' | 'unisexe';

/** Valeur du bouton public sur les pages catégorie (pas de 3e bouton). */
export type AudienceFilter = Exclude<ProductAudience, 'unisexe'>;

/** Défaut métier : tout produit non classé est traité comme HOMME. */
export const DEFAULT_PRODUCT_AUDIENCE: ProductAudience = 'homme';

export const PRODUCT_AUDIENCE_OPTIONS: Array<{ value: ProductAudience; label: string }> = [
  { value: 'homme', label: 'Homme' },
  { value: 'femme', label: 'Femme' },
  { value: 'unisexe', label: 'Unisexe' }
];

export function isProductAudience(value: unknown): value is ProductAudience {
  return value === 'homme' || value === 'femme' || value === 'unisexe';
}

/**
 * Résout le public cible effectif d'un produit : la valeur enregistrée si
 * elle est valide, sinon HOMME (défaut métier — un produit oublié n'est
 * jamais réparti des deux côtés).
 */
export function resolveProductAudience(audience: unknown): ProductAudience {
  return isProductAudience(audience) ? audience : DEFAULT_PRODUCT_AUDIENCE;
}

/**
 * Un produit répond-il à la vue « Homme » / « Femme » ?
 * - 'unisexe' → visible dans les deux vues (une seule occurrence par vue).
 * - NULL / absent / invalide → résolu en HOMME : visible uniquement en vue
 *   Homme (défaut propriétaire 16/10).
 */
export function matchesAudienceFilter(
  audience: ProductAudience | null | undefined,
  filter: AudienceFilter
): boolean {
  const resolved = resolveProductAudience(audience);
  return resolved === 'unisexe' ? true : resolved === filter;
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
