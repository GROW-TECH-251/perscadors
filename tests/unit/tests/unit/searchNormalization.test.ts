import { describe, it, expect } from 'vitest';
import { searchCatalogProducts } from '@/services/publicCatalogService';
import type { Product } from '@/types';

// Consolidation 09/2026 — la navbar (searchCatalogProducts) doit trouver
// EXACTEMENT ce que la page catégorie (?search= + normalizeProductAttribute)
// trouve : accents pliés, casse, espaces repliés. Réels cas mesurés en sonde.
const FIXTURES: Product[] = [
  {
    id: '1',
    name: 'Basket Urban Luxe Gold',
    slug: 'basket-urban-luxe-gold',
    category: 'basket-pour-homme',
    price: 24500,
    image_url: '/img.jpg',
    images: ['/img.jpg'],
    sizes: ['41', '42'],
    outOfStockSizes: [],
    colors: ['Or'],
    outOfStockColors: [],
    inStock: true,
    description: 'Affirmez votre statut avec cette basket unique. Pièces signées HP Collection.',
    isPopular: false,
  },
  {
    id: '2',
    name: 'Sneaker High Top Noir Intense',
    slug: 'sneaker-high-top',
    category: 'basket-pour-homme',
    price: 25000,
    image_url: '/img2.jpg',
    images: ['/img2.jpg'],
    sizes: ['43'],
    outOfStockSizes: [],
    colors: ['Noir'],
    outOfStockColors: [],
    inStock: true,
    description: 'Un style élégant et intemporel.',
    isPopular: false,
  },
];

describe('Unit — Recherche navbar : normalisation unifiée (consolidation)', () => {
  it('CAS1 exact : nom complet trouvé', () => {
    expect(searchCatalogProducts(FIXTURES, 'Basket Urban Luxe Gold')).toHaveLength(1);
  });

  it('CAS2 partiel : « urban » trouve la basket Urban', () => {
    const res = searchCatalogProducts(FIXTURES, 'urban');
    expect(res.some((p) => p.name === 'Basket Urban Luxe Gold')).toBe(true);
  });

  it('CAS3 casse : « BASKET URBAN » == « basket urban »', () => {
    expect(searchCatalogProducts(FIXTURES, 'BASKET URBAN')).toHaveLength(
      searchCatalogProducts(FIXTURES, 'basket urban').length
    );
  });

  it('CAS4 espaces : avant/après/multiples repliés', () => {
    expect(searchCatalogProducts(FIXTURES, '   basket   ')).toHaveLength(
      searchCatalogProducts(FIXTURES, 'basket').length
    );
  });

  it('CAS5 accents : « signées » ET « signees » trouvent la description accentuée', () => {
    expect(searchCatalogProducts(FIXTURES, 'signées')).toHaveLength(1);
    expect(searchCatalogProducts(FIXTURES, 'signees')).toHaveLength(1);
    expect(searchCatalogProducts(FIXTURES, 'éLÉGANT')).toHaveLength(1);
  });

  it('CAS6 inexistant : tableau vide (déclencheur du no-results)', () => {
    expect(searchCatalogProducts(FIXTURES, 'zzzzqqqq')).toHaveLength(0);
  });

  it('requête vide/blanche : tout le catalogue (aucun filtre)', () => {
    expect(searchCatalogProducts(FIXTURES, '')).toHaveLength(2);
    expect(searchCatalogProducts(FIXTURES, '    ')).toHaveLength(2);
  });
});
