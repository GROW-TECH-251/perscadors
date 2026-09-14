import { describe, it, expect } from 'vitest';
import {
  AUTRES_SLUG,
  headerCategorySlugs,
  HISTORICAL_CATEGORY_OPTIONS,
  buildCategorySelectOptions,
  buildDeleteConfirmMessage,
  isAutresCategory,
  slugifyCategoryName
} from '@/admin/categoryManagement';
import type { AdminCategory } from '@/admin/types';

function categorie(partiel: Partial<AdminCategory>): AdminCategory {
  return {
    id: 1, name: 'Test', category: 'test', visible: true, position: 1,
    created_at: '2026-01-01', updated_at: '2026-01-01', ...partiel
  } as AdminCategory;
}

describe('slugifyCategoryName (E9)', () => {
  it('génère un slug depuis un nom simple', () => {
    expect(slugifyCategoryName('Mode Femme')).toBe('mode-femme');
  });

  it('retire les accents', () => {
    expect(slugifyCategoryName('Élégance Accessoires')).toBe('elegance-accessoires');
  });

  it('remplace les caractères spéciaux', () => {
    expect(slugifyCategoryName('Jeans & Pantalons!')).toBe('jeans-pantalons');
  });

  it('trim les tirets extrêmes', () => {
    expect(slugifyCategoryName('  --Baskets--  ')).toBe('baskets');
  });

  it('retourne une chaîne vide pour un nom sans caractère utile', () => {
    expect(slugifyCategoryName('???')).toBe('');
  });
});

describe('isAutresCategory (E9)', () => {
  it('reconnaît la catégorie système par son slug', () => {
    expect(isAutresCategory(categorie({ category: AUTRES_SLUG }))).toBe(true);
  });

  it('ne confond pas avec une catégorie normale', () => {
    expect(isAutresCategory(categorie({ category: 'jeans' }))).toBe(false);
  });

  it('reconnaît « autres » même avec un libellé différent', () => {
    expect(isAutresCategory(categorie({ name: 'Divers', category: 'autres' }))).toBe(true);
  });
});

describe('buildDeleteConfirmMessage (E9)', () => {
  it('catégorie vide : message sans transfert', () => {
    expect(buildDeleteConfirmMessage('Robes', 0)).toContain('ne contient aucun produit');
  });

  it('catégorie avec produits : annonce le transfert et la non-suppression', () => {
    const message = buildDeleteConfirmMessage('Jeans', 12);
    expect(message).toContain('12 produits');
    expect(message).toContain('« Autres »');
    expect(message).toContain('Aucun produit ne sera supprimé');
  });

  it('accord au singulier pour 1 produit', () => {
    expect(buildDeleteConfirmMessage('Robes', 1)).toContain('1 produit. Si vous la supprimez, ce produit sera');
  });

  it('comptage indisponible : message prudent sans chiffre', () => {
    const message = buildDeleteConfirmMessage('Robes', -1);
    expect(message).toContain("n'a pas pu être vérifié");
    expect(message).toContain('« Autres »');
  });
});

describe('headerCategorySlugs (E10 — règle du header public)', () => {
  it('retourne les 4 premières catégories visibles dans l ordre de position', () => {
    const slugs = headerCategorySlugs([
      categorie({ id: 1, name: 'A', category: 'a', position: 1 }),
      categorie({ id: 2, name: 'B', category: 'b', position: 2 }),
      categorie({ id: 3, name: 'C', category: 'c', position: 3 }),
      categorie({ id: 4, name: 'D', category: 'd', position: 4 }),
      categorie({ id: 5, name: 'E', category: 'e', position: 5 })
    ]);
    expect(slugs).toEqual(['a', 'b', 'c', 'd']);
  });

  it('saute les catégories masquées : la 5e visible prend la place', () => {
    const slugs = headerCategorySlugs([
      categorie({ id: 1, name: 'A', category: 'a', position: 1 }),
      categorie({ id: 2, name: 'B', category: 'b', position: 2, visible: false }),
      categorie({ id: 3, name: 'C', category: 'c', position: 3 }),
      categorie({ id: 4, name: 'D', category: 'd', position: 4 }),
      categorie({ id: 5, name: 'E', category: 'e', position: 5 })
    ]);
    expect(slugs).toEqual(['a', 'c', 'd', 'e']);
  });

  it('retourne moins de 4 slugs si moins de 4 catégories visibles', () => {
    const slugs = headerCategorySlugs([categorie({ id: 1, name: 'A', category: 'a' })]);
    expect(slugs).toEqual(['a']);
  });

  it('retourne un tableau vide sans catégories', () => {
    expect(headerCategorySlugs([])).toEqual([]);
  });
});

describe('buildCategorySelectOptions (E9)', () => {
  it('utilise les catégories visibles de la base', () => {
    const options = buildCategorySelectOptions([
      categorie({ id: 1, name: 'Baskets', category: 'baskets', visible: true }),
      categorie({ id: 2, name: 'Cachée', category: 'cachee', visible: false })
    ]);
    expect(options).toEqual([{ value: 'baskets', label: 'Baskets' }]);
  });

  it('repli historique quand la base ne renvoie rien', () => {
    expect(buildCategorySelectOptions([])).toEqual(HISTORICAL_CATEGORY_OPTIONS);
  });

  it('ajoute la catégorie actuelle du produit si absente', () => {
    const options = buildCategorySelectOptions(
      [categorie({ id: 1, name: 'Baskets', category: 'baskets' })],
      'ancien-slug-disparu'
    );
    expect(options).toHaveLength(2);
    expect(options[1]).toEqual({ value: 'ancien-slug-disparu', label: 'ancien slug disparu (catégorie actuelle)' });
  });

  it('ne duplique pas la catégorie actuelle si déjà présente', () => {
    const options = buildCategorySelectOptions(
      [categorie({ id: 1, name: 'Baskets', category: 'baskets' })],
      'baskets'
    );
    expect(options).toEqual([{ value: 'baskets', label: 'Baskets' }]);
  });
});
