import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import {
  DEFAULT_PRODUCT_AUDIENCE,
  PRODUCT_AUDIENCE_OPTIONS,
  filterProductsByAudience,
  isProductAudience,
  matchesAudienceFilter,
  resolveProductAudience,
  type ProductAudience
} from '@/lib/productAudience';

// LOT 3 (révision 16/10) — classification par public cible, DÉFAUT HOMME.
// La donnée fait foi : target_audience ('homme' | 'femme' | 'unisexe').
// Un produit non classé (NULL/absent/invalide) est traité comme HOMME — il
// ne s'affiche plus « des deux côtés ». Unisexe : visible dans les DEUX vues,
// une seule carte par produit (jamais de doublon).

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

describe('Unit — LOT 3 (révision défaut Homme) : lib/productAudience', () => {
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

  it('DEFAULT_PRODUCT_AUDIENCE = homme (défaut propriétaire 16/10)', () => {
    expect(DEFAULT_PRODUCT_AUDIENCE).toBe('homme');
  });

  it('resolveProductAudience : valeur valide conservée, tout le reste résolu en Homme', () => {
    expect(resolveProductAudience('homme')).toBe('homme');
    expect(resolveProductAudience('femme')).toBe('femme');
    expect(resolveProductAudience('unisexe')).toBe('unisexe');
    expect(resolveProductAudience(null)).toBe('homme');
    expect(resolveProductAudience(undefined)).toBe('homme');
    expect(resolveProductAudience('enfant')).toBe('homme');
  });

  it('matchesAudienceFilter : unisexe dans les deux vues ; non classé = Homme uniquement', () => {
    expect(matchesAudienceFilter('homme', 'homme')).toBe(true);
    expect(matchesAudienceFilter('homme', 'femme')).toBe(false);
    expect(matchesAudienceFilter('femme', 'femme')).toBe(true);
    expect(matchesAudienceFilter('femme', 'homme')).toBe(false);
    // Règle Unisexe : les deux vues, sans exception.
    expect(matchesAudienceFilter('unisexe', 'homme')).toBe(true);
    expect(matchesAudienceFilter('unisexe', 'femme')).toBe(true);
    // Règle défaut Homme : un produit oublié n'est JAMAIS réparti des deux
    // côtés — il vit en vue Homme seulement.
    expect(matchesAudienceFilter(null, 'homme')).toBe(true);
    expect(matchesAudienceFilter(null, 'femme')).toBe(false);
    expect(matchesAudienceFilter(undefined, 'homme')).toBe(true);
    expect(matchesAudienceFilter(undefined, 'femme')).toBe(false);
    // Les valeurs invalides sont couvertes par resolveProductAudience (unknown)
    // puis résolues Homme — matchesAudienceFilter reçoit un type garanti par
    // la contrainte CHECK de la base.
  });

  it('filterProductsByAudience — matrice complète : homme / femme / mélange / vide', () => {
    const vueHomme = filterProductsByAudience(CATALOGUE, 'homme');
    const vueFemme = filterProductsByAudience(CATALOGUE, 'femme');
    // Vue Homme : homme + unisexe + non classés (traités Homme).
    expect(vueHomme.map((p) => p.id)).toEqual([1, 3, 4, 5]);
    // Vue Femme : femme + unisexe uniquement — les non classés disparaissent.
    expect(vueFemme.map((p) => p.id)).toEqual([2, 3]);
    // Unisexe (3) présent exactement UNE fois dans chaque vue — pas de doublon.
    expect(vueHomme.filter((p) => p.id === 3)).toHaveLength(1);
    expect(vueFemme.filter((p) => p.id === 3)).toHaveLength(1);
    // Cas limites.
    expect(filterProductsByAudience([], 'homme')).toEqual([]);
    expect(filterProductsByAudience<ProduitTest>([{ id: 9 }], 'femme')).toEqual([]);
    expect(filterProductsByAudience<ProduitTest>([{ id: 9 }], 'homme').map((p) => p.id)).toEqual([9]);
  });

  it('PRODUCT_AUDIENCE_OPTIONS : exactement Homme / Femme / Unisexe pour le select admin', () => {
    expect(PRODUCT_AUDIENCE_OPTIONS).toEqual([
      { value: 'homme', label: 'Homme' },
      { value: 'femme', label: 'Femme' },
      { value: 'unisexe', label: 'Unisexe' }
    ]);
  });
});

describe('Unit — LOT 3 (révision) : intégration source (garde-railles)', () => {
  it('page catégorie : Homme actif par défaut, deux boutons, aucun 3e bouton Unisexe', async () => {
    const source = await readFile('src/app/categorie/[slug]/category-client.tsx', 'utf-8');
    expect(source).toContain("useState<AudienceFilter>('homme')");
    expect(source).toContain("(['homme', 'femme'] as const)");
    expect(source).toContain('aria-pressed={audience === key}');
    expect(source).toContain('filterProductsByAudience(rawProducts, audience)');
    // Pas de bouton public Unisexe sur la page catégorie.
    expect(source).not.toContain("label: 'Unisexe'");
  });

  it('formulaires admin : « Public cible » pré-sélectionné sur Homme + garde de validation', async () => {
    const creation = await readFile('src/app/admin/produits/nouveau/page.tsx', 'utf-8');
    expect(creation).toContain("target_audience: 'homme'");
    expect(creation).toContain('label="Public cible"');
    expect(creation).toContain("if (!formData.target_audience)");

    const edition = await readFile('src/app/admin/produits/[id]/page.tsx', 'utf-8');
    expect(edition).toContain("target_audience: 'homme'");
    // L'édition charge la valeur enregistrée ; un NULL résiduel est proposé
    // en Homme (jamais réparti des deux côtés, jamais deviné autrement).
    expect(edition).toContain("target_audience: data.target_audience ?? 'homme'");
    expect(edition).toContain('label="Public cible"');
    expect(edition).toContain("if (!formData.target_audience)");
  });

  it('liste admin Produits : filtre « Public » (Tous/Homme/Femme/Unisexe) + pastille par carte', async () => {
    const source = await readFile('src/app/admin/produits/page.tsx', 'utf-8');
    expect(source).toContain("useState<'all' | ProductAudience>('all')");
    expect(source).toContain('resolveProductAudience(product.target_audience) === audienceFilter');
    expect(source).toContain('return matchesSearch && matchesFilter && matchesAudience;');
    expect(source).toContain('PRODUCT_AUDIENCE_OPTIONS.map((option) =>');
    expect(source).toContain('AUDIENCE_LABELS[audience]');
    expect(source).toContain('AUDIENCE_BADGE_STYLES[audience]');
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

  it('migration finale : défaut homme, rattrapage des NULL UNIQUEMENT vers homme, NOT NULL, idempotente', async () => {
    const sql = await readFile('supabase/migrations/add_product_target_audience.sql', 'utf-8');
    expect(sql).toContain('add column if not exists target_audience text');
    expect(sql).toContain("check (target_audience is null or target_audience in ('homme', 'femme', 'unisexe'))");
    expect(sql).toContain("alter column target_audience set default 'homme'");
    expect(sql).toContain('alter column target_audience set not null');
    // Le SEUL update autorisé (décision propriétaire) : NULL -> homme.
    expect(sql).toContain('update public.products');
        expect(sql.toLowerCase()).not.toContain("set target_audience = 'femme'");
    expect(sql.toLowerCase()).not.toContain("set target_audience = 'unisexe'");
    expect(sql).toContain('where target_audience is null');
  });
});
