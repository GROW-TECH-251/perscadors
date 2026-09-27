import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { normalizeProductAttribute } from '@/utils/normalizeProductAttribute';
import { searchCatalogProducts } from '@/services/publicCatalogService';
import type { Product } from '@/types';

// E4 — Search UX : requête persistante navbar + écho URL + emojis ignorés.
// Décisions actées : (1) les emojis de la requête sont retirés par la
// normalisation (aucun article n'en contient dans son nom) ; (2) le champ
// navbar échoite l'URL (?search=) — l'URL est l'unique vérité ; (3) une
// requête vide après normalisation (emojis seuls) ne déclenche AUCUNE
// navigation, sinon elle ramènerait tous les produits et emmènerait au
// premier d'entre eux.

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
    description: 'Affirmez votre statut avec cette basket unique.',
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

async function extraireSubmit(): Promise<string> {
  const src = await readFile('src/components/public/layout/Navbar.tsx', 'utf-8');
  const start = src.indexOf('const handleSearchSubmit');
  return src.slice(start, src.indexOf('return (', start));
}

describe('Unit — E4 normalisation : les emojis ne bloquent plus la recherche', () => {
  it('les emojis (pictogrammes, sélecteur de variation, ZWJ) sont retirés', () => {
    expect(normalizeProductAttribute('basket 🔥👟')).toBe('basket');
    expect(normalizeProductAttribute('Basket 🔥')).toBe('basket');
    expect(normalizeProductAttribute('Sneaker 👟 High')).toBe('sneaker high');
    expect(normalizeProductAttribute('🔥')).toBe('');
    expect(normalizeProductAttribute('👟🔥🙌')).toBe('');
  });

  it('non-régression : accents, casse et espaces restent pliés comme avant', () => {
    expect(normalizeProductAttribute('  Baskets   Signées ')).toBe('baskets signees');
    // Œ (U+0152) n'est pas décomposable en NFD : comportement inchangé d'avant E4.
    expect(normalizeProductAttribute('Œuvre Café')).toBe('œuvre cafe');
    expect(normalizeProductAttribute('signées')).toBe('signees');
  });

  it('recherche : « basket 🔥 » trouve désormais les articles', () => {
    expect(searchCatalogProducts(FIXTURES, 'basket 🔥')).toHaveLength(2);
    expect(searchCatalogProducts(FIXTURES, 'basket')).toHaveLength(2);
  });
});

describe('Unit — E4 navbar : persistance + écho URL + garde emojis', () => {
  it("la soumission n'efface plus le champ (plus de setSearchQuery('') post-submit)", async () => {
    const submit = await extraireSubmit();
    expect(submit).not.toContain("setSearchQuery('')");
  });

  it("le champ échoite l'URL : effet de synchronisation sur ?search= à chaque navigation", async () => {
    const src = await readFile('src/components/public/layout/Navbar.tsx', 'utf-8');
    expect(src).toContain("params.get('search') ?? ''");
    expect(src).toMatch(/useEffect\(\(\) => \{[\s\S]{0,200}URLSearchParams\(window\.location\.search\)/);
    expect(src).toContain('}, [pathname]);');
  });

  it('une requête vide après normalisation (emojis seuls) ne navigue pas', async () => {
    const src = await readFile('src/components/public/layout/Navbar.tsx', 'utf-8');
    expect(src).toContain('if (!normalizeProductAttribute(searchQuery)) {');
  });

  it('la soumission passe par le normaliseur partagé (plus de toLowerCase brut)', async () => {
    const submit = await extraireSubmit();
    expect(submit).not.toContain('toLowerCase().trim()');
    expect(submit).toContain('normalizeProductAttribute(searchQuery)');
  });
});
