import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import {
  PRODUCT_AUDIENCE_OPTIONS,
  filterProductsByAudience,
  isProductAudience,
  matchesAudienceFilter,
  type ProductAudience
} from '@/lib/productAudience';

// LOT 3 (10/2026) — classification par public cible.
// La donnée fait foi : target_audience ('homme' | 'femme' | 'unisexe').
// Homme actif par défaut sur les pages catégorie ; Unisexe visible dans les
// DEUX vues, une seule carte par produit (jamais de doublon) ; non classé
// (NULL) visible dans les deux vues (transitoire, classification manuelle).

interface ProduitTest {
  id: number;
  target_audience?: ProductAudience | null;
}

const CATALOGUE: ProduitTest[] = [
  { id: 1, target_audience: 'homme' },
  { id: 2, target_audience: 'femme' },
  { id: 3, target_audience: 'unisexe' },
  { id: 4, target_audience: null },
  { id: 5 }
];

describe('Unit — LOT 3 : lib/productAudience', () => {
  it('isProductAudience : accepte les 3 valeurs métier, rejette tout le reste', () => {
    expect(isProductAudience('homme')).toBe(true);
    expect(isProductAudience('femme')).toBe(true);
    expect(isProductAudience('unisexe')).toBe(true);
    expect(isProductAudience(null)).toBe(false);
    expect(isProductAudience(undefined)).toBe(false);
    expect(isProductAudience('enfant')).toBe(false);
    expect(isProductAudience('Homme')).toBe(false); // casse exacte
    expect(isProductAudience(42)).toBe(false);
  });

  it('matchesAudienceFilter : unisexe et non classé visibles dans les deux vues', () => {
    expect(matchesAudienceFilter('homme', 'homme')).toBe(true);
    expect(matchesAudienceFilter('homme', 'femme')).toBe(false);
    expect(matchesAudienceFilter('femme', 'femme')).toBe(true);
    expect(matchesAudienceFilter('femme', 'homme')).toBe(false);
    // Règle Unisexe : les deux vues, sans exception.
    expect(matchesAudienceFilter('unisexe', 'homme')).toBe(true);
    expect(matchesAudienceFilter('unisexe', 'femme')).toBe(true);
    // Comportement transitoire : non classé jamais masqué.
    expect(matchesAudienceFilter(null, 'homme')).toBe(true);
    expect(matchesAudienceFilter(null, 'femme')).toBe(true);
    expect(matchesAudienceFilter(undefined, 'homme')).toBe(true);
    expect(matchesAudienceFilter(undefined, 'femme')).toBe(true);
  });

  it('filterProductsByAudience — matrice complète : homme / femme / mélange / vide', () => {
    const vueHomme = filterProductsByAudience(CATALOGUE, 'homme');
    const vueFemme = filterProductsByAudience(CATALOGUE, 'femme');
    expect(vueHomme.map((p) => p.id)).toEqual([1, 3, 4, 5]);
    expect(vueFemme.map((p) => p.id)).toEqual([2, 3, 4, 5]);
    // Unisexe (3) présent exactement UNE fois dans chaque vue — pas de doublon.
    expect(vueHomme.filter((p) => p.id === 3)).toHaveLength(1);
    expect(vueFemme.filter((p) => p.id === 3)).toHaveLength(1);
    // Cas limites.
    expect(filterProductsByAudience([], 'homme')).toEqual([]);
    expect(filterProductsByAudience<ProduitTest>([{ id: 9 }], 'femme').map((p) => p.id)).toEqual([9]);
  });

  it('PRODUCT_AUDIENCE_OPTIONS : exactement Homme / Femme / Unisexe pour le select admin', () => {
    expect(PRODUCT_AUDIENCE_OPTIONS).toEqual([
      { value: 'homme', label: 'Homme' },
      { value: 'femme', label: 'Femme' },
      { value: 'unisexe', label: 'Unisexe' }
    ]);
  });
});

describe('Unit — LOT 3 : intégration source (garde-railles)', () => {
  it('page catégorie : Homme actif par défaut, deux boutons, aucun 3e bouton Unisexe', async () => {
    const source = await readFile('src/app/categorie/[slug]/category-client.tsx', 'utf-8');
    expect(source).toContain("useState<AudienceFilter>('homme')");
    expect(source).toContain("(['homme', 'femme'] as const)");
    expect(source).toContain('aria-pressed={audience === key}');
    expect(source).toContain('filterProductsByAudience(rawProducts, audience)');
    // Pas de bouton public Unisexe sur la page catégorie.
    expect(source).not.toContain("label: 'Unisexe'");
  });

  it('formulaires admin : select « Public cible » requis + validation avant enregistrement', async () => {
    for (const fichier of [
      'src/app/admin/produits/nouveau/page.tsx',
      'src/app/admin/produits/[id]/page.tsx'
    ]) {
      const source = await readFile(fichier, 'utf-8');
      expect(source, fichier).toContain('label="Public cible"');
      expect(source, fichier).toContain('placeholder="Sélectionner le public cible"');
      expect(source, fichier).toContain("if (!formData.target_audience)");
      expect(source, fichier).toContain(
        "setToast({ message: 'Le public cible (Homme, Femme ou Unisexe) est obligatoire.', variant: 'error' });"
      );
    }
    // L'édition charge la valeur enregistrée (jamais devinée).
    const edition = await readFile('src/app/admin/produits/[id]/page.tsx', 'utf-8');
    expect(edition).toContain('target_audience: data.target_audience ?? null');
  });

  it('types et mapping : target_audience traverse AdminProduct, Product, ProductFormData et le catalogue public', async () => {
    const adminTypes = await readFile('src/admin/types.ts', 'utf-8');
    expect(adminTypes).toContain('target_audience?: ProductAudience | null;');
    expect((adminTypes.match(/target_audience\?: ProductAudience \| null;/g) || []).length).toBe(2);
    const publicTypes = await readFile('src/types/index.ts', 'utf-8');
    expect(publicTypes).toContain('target_audience?: ProductAudience | null;');
    const mapping = await readFile('src/services/publicCatalogService.ts', 'utf-8');
    expect(mapping).toContain('target_audience: product.target_audience ?? null');
  });

  it('migration : colonne + contrainte CHECK, et AUCUN backfill (aucune classification arbitraire)', async () => {
    const sql = await readFile('supabase/migrations/add_product_target_audience.sql', 'utf-8');
    expect(sql).toContain('add column if not exists target_audience text');
    expect(sql).toContain("check (target_audience is null or target_audience in ('homme', 'femme', 'unisexe'))");
    // Interdiction absolue : ne jamais deviner la classification des existants.
    expect(sql.toLowerCase()).not.toContain('update public.products');
    expect(sql.toLowerCase()).not.toContain('update products');
  });
});
