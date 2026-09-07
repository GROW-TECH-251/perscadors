import { describe, it, expect } from 'vitest';
import { isAllowedMediaFolder } from '@/lib/cloudinary';

// E2 — Garde de signature Cloudinary : l'allowlist stricte historique
// refusait « perscadors/products/<id> » (folder envoyé par uploadProductVideo),
// donc TOUT upload de vidéo produit échouait en 400 « Destination média
// invalide » — cause racine du « 0 vidéo produit » constaté en production.

describe('Unit — E2 garde signature : dossiers autorisés', () => {
  it('les trois sections contenu restent autorisées (égalité stricte)', () => {
    expect(isAllowedMediaFolder('perscadors/hero')).toBe(true);
    expect(isAllowedMediaFolder('perscadors/testimonials')).toBe(true);
    expect(isAllowedMediaFolder('perscadors/ambience')).toBe(true);
  });

  it('les vidéos produit sont autorisées : id numérique, draft, slug', () => {
    expect(isAllowedMediaFolder('perscadors/products/12')).toBe(true);
    expect(isAllowedMediaFolder('perscadors/products/draft')).toBe(true);
    expect(isAllowedMediaFolder('perscadors/products/tee-shirt_hp-2026')).toBe(true);
  });

  it('segment produit obligatoire et unique (pas de traversal, pas de dossier vague)', () => {
    expect(isAllowedMediaFolder('perscadors/products')).toBe(false);
    expect(isAllowedMediaFolder('perscadors/products/')).toBe(false);
    expect(isAllowedMediaFolder('perscadors/products/12/x')).toBe(false);
    expect(isAllowedMediaFolder('perscadors/products/../../secret')).toBe(false);
    expect(isAllowedMediaFolder('perscadors/products/a b')).toBe(false);
  });

  it('tout autre dossier, vide ou casse différente est refusé', () => {
    expect(isAllowedMediaFolder('perscadors/logo')).toBe(false);
    expect(isAllowedMediaFolder('perscadors/HERO')).toBe(false);
    expect(isAllowedMediaFolder('autre/hero')).toBe(false);
    expect(isAllowedMediaFolder('')).toBe(false);
    expect(isAllowedMediaFolder('   ')).toBe(false);
  });
});
