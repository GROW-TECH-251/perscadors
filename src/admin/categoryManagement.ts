// Helpers purs de gestion des catégories (E9) — partagés entre la page
// Produits et les tests. Aucune dépendance DOM ni réseau.

import type { AdminCategory } from '@/admin/types';

export const AUTRES_SLUG = 'autres';

export function slugifyCategoryName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function isAutresCategory(category: Pick<AdminCategory, 'category'>): boolean {
  return category.category === AUTRES_SLUG;
}

// Message de confirmation de suppression. count = 0 : catégorie vide ;
// count > 0 : produits transférés vers « Autres » ; count < 0 : comptage
// indisponible (on prévient sans chiffre, sans bloquer la décision).
export function buildDeleteConfirmMessage(categoryName: string, productCount: number): string {
  if (productCount < 0) {
    return `Le nombre de produits de « ${categoryName} » n'a pas pu être vérifié. S'il en contient, ils seront automatiquement déplacés vers « Autres ». Aucun produit ne sera supprimé. Voulez-vous continuer ?`;
  }
  if (productCount === 0) {
    return `Cette catégorie ne contient aucun produit. Voulez-vous vraiment supprimer « ${categoryName} » ?`;
  }
  const pluriel = productCount > 1 ? 's' : '';
  return `Cette catégorie contient ${productCount} produit${pluriel}. Si vous la supprimez, ${productCount > 1 ? 'ces produits seront' : 'ce produit sera'} automatiquement déplacé${pluriel} vers « Autres ». Aucun produit ne sera supprimé. Voulez-vous continuer ?`;
}

// Repli historique : environnement sans base (build de test/CI) — ce sont les
// 4 catégories qui étaient codées en dur dans les formulaires produit.
export const HISTORICAL_CATEGORY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'basket-pour-homme', label: 'Baskets Homme' },
  { value: 'complet-pour-homme', label: 'Complets Streetwear' },
  { value: 'jean-overside-pour-homme', label: 'Jeans Oversize' },
  { value: 'tapettes-pour-homme', label: 'Tapettes & Sandales' }
];

// Options du sélecteur catégorie des formulaires produit : catégories
// réellement présentes en base (visibles), + la catégorie actuelle du produit
// (même masquée ou disparue) pour ne jamais corrompre une fiche existante,
// + repli historique si la base ne répond rien.
export function buildCategorySelectOptions(
  categories: AdminCategory[],
  currentSlug?: string | null
): Array<{ value: string; label: string }> {
  const options = categories
    .filter((category) => category.visible)
    .map((category) => ({ value: category.category, label: category.name }));

  if (options.length === 0) options.push(...HISTORICAL_CATEGORY_OPTIONS.map((option) => ({ ...option })));

  if (currentSlug && !options.some((option) => option.value === currentSlug)) {
    const current = categories.find((category) => category.category === currentSlug);
    options.push({
      value: currentSlug,
      label: `${current?.name || currentSlug.replace(/-/g, ' ')} (catégorie actuelle)`
    });
  }

  return options;
}
