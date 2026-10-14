import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import {
  HOME_CATEGORY_LIMIT,
  selectHomeCategories,
  sortCategoriesByPosition
} from '@/lib/publicCategoryOrder';
import type { CatalogCategory } from '@/types';

// P1 (finalisation 10/2026) — garde de l'ordre public des catégories :
// la grille d'accueil affiche les 8 premières catégories selon l'ordre
// défini dans l'admin (tri par position PUIS découpe), la page /categories
// les affiche toutes. Les tests « source » verrouillent les acquis du
// correctif 1A (positions 1-based, message session explicite).

function buildCategory(slug: string, position?: number): CatalogCategory {
  return {
    name: slug,
    slug,
    image: '/assets/brand/logo.png',
    count: 0,
    countLabel: '0 produit',
    tagline: 'Sélection premium.',
    ...(position === undefined ? {} : { position })
  };
}

describe('Unit — P1 ordre public des catégories (1B/1C)', () => {
  it('HOME_CATEGORY_LIMIT vaut 8 (grille d’accueil)', () => {
    expect(HOME_CATEGORY_LIMIT).toBe(8);
  });

  it('tri par position admin croissante (10 catégories mélangées)', () => {
    const categories = [
      buildCategory('c-5', 5),
      buildCategory('c-1', 1),
      buildCategory('c-10', 10),
      buildCategory('c-3', 3),
      buildCategory('c-2', 2),
      buildCategory('c-9', 9),
      buildCategory('c-4', 4),
      buildCategory('c-7', 7),
      buildCategory('c-6', 6),
      buildCategory('c-8', 8)
    ];

    expect(sortCategoriesByPosition(categories).map((category) => category.slug)).toEqual([
      'c-1', 'c-2', 'c-3', 'c-4', 'c-5', 'c-6', 'c-7', 'c-8', 'c-9', 'c-10'
    ]);
  });

  it('découpe à 8 : ce sont les positions 1 à 8, pas les 8 premières de la liste', () => {
    const categories = [
      buildCategory('k-10', 10),
      buildCategory('k-9', 9),
      buildCategory('k-2', 2),
      buildCategory('k-1', 1),
      buildCategory('k-4', 4),
      buildCategory('k-3', 3),
      buildCategory('k-6', 6),
      buildCategory('k-5', 5),
      buildCategory('k-8', 8),
      buildCategory('k-7', 7)
    ];

    const selected = selectHomeCategories(categories);

    expect(selected).toHaveLength(8);
    expect(selected.map((category) => category.position)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(selected.map((category) => category.slug)).not.toContain('k-9');
    expect(selected.map((category) => category.slug)).not.toContain('k-10');
  });

  it('moins de 8 catégories : toutes conservées, dans l’ordre admin', () => {
    const categories = [
      buildCategory('f-3', 3),
      buildCategory('f-1', 1),
      buildCategory('f-2', 2)
    ];

    expect(selectHomeCategories(categories).map((category) => category.slug)).toEqual([
      'f-1', 'f-2', 'f-3'
    ]);
  });

  it('positions égales : l’ordre d’entrée est conservé (tri stable)', () => {
    const categories = [
      buildCategory('e-a', 2),
      buildCategory('e-b', 1),
      buildCategory('e-c', 2),
      buildCategory('e-d', 1)
    ];

    expect(sortCategoriesByPosition(categories).map((category) => category.slug)).toEqual([
      'e-b', 'e-d', 'e-a', 'e-c'
    ]);
  });

  it('sans position (catalogue de repli) : en fin de liste, ordre relatif intact', () => {
    const categories = [
      buildCategory('db-2', 2),
      buildCategory('repli-a'),
      buildCategory('db-1', 1),
      buildCategory('repli-b')
    ];

    expect(sortCategoriesByPosition(categories).map((category) => category.slug)).toEqual([
      'db-1', 'db-2', 'repli-a', 'repli-b'
    ]);
  });

  it('le tableau d’entrée n’est pas muté', () => {
    const categories = [buildCategory('m-2', 2), buildCategory('m-1', 1)];
    const original = [...categories];

    sortCategoriesByPosition(categories);

    expect(categories).toEqual(original);
  });
});

describe('Unit — P1 gardes source (correctifs 1A/1B/1C)', () => {
  it('categoryService : positions 1-based — régression du refus 23514 du réordonnancement', async () => {
    const source = await readFile('src/services/categoryService.ts', 'utf-8');
    expect(source).toContain('position: index + 1');
    expect(source).not.toMatch(/position:\s*index\s*$/m);
  });

  it('categoryService : message explicite session expirée / droits (42501, PGRST301)', async () => {
    const source = await readFile('src/services/categoryService.ts', 'utf-8');
    expect(source).toContain("error?.code === '42501'");
    expect(source).toContain("error?.code === 'PGRST301'");
    expect(source).toContain('friendlyMutationError(error)');
  });

  it('CategoryGrid : garde tri+8 et CTA « Voir toutes les catégories » vers /categories', async () => {
    const source = await readFile('src/components/public/home/CategoryGrid.tsx', 'utf-8');
    expect(source).toContain('selectHomeCategories');
    expect(source).toContain('Voir toutes les catégories');
    expect(source).toContain('href="/categories"');
  });

  it('publicCatalogService : la position admin voyage jusqu’au catalogue public', async () => {
    const source = await readFile('src/services/publicCatalogService.ts', 'utf-8');
    expect(source).toContain('position: category.position');
  });

  it('la page publique /categories existe (serveur + client)', async () => {
    const page = await readFile('src/app/categories/page.tsx', 'utf-8');
    expect(page).toContain('generateMetadata');
    expect(page).toContain('allCategoriesMetadata');
    const client = await readFile('src/app/categories/categories-client.tsx', 'utf-8');
    expect(client).toContain('sortCategoriesByPosition');
    expect(client).toContain('Toutes les catégories');
  });
});
