import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { searchCatalogProducts } from '@/services/publicCatalogService';
import type { Product } from '@/types';

// E5 — Intégration Riel (sélective, adaptée) : scoring de pertinence fusionné
// avec la normalisation consolidée (accents pliés + emojis ignorés), suggestions
// navbar gardées contre les requêtes 100% emoji et sans effacement du champ
// (persistance E4), no-results catégorie INLINE (modale compacte + « Complète
// le look »), « Autres résultats pour X » sur la fiche produit.

const CATALOGUE: Product[] = [
  {
    id: '1', name: 'Basket Urban Luxe Gold', slug: 's1', category: 'basket-pour-homme', price: 1,
    image_url: '/a.jpg', images: ['/a.jpg'], sizes: ['41'], outOfStockSizes: [], colors: ['Or'], outOfStockColors: [],
    inStock: true, description: 'Un style élégant.', isPopular: false,
  },
  {
    id: '2', name: 'Basket Run Essential', slug: 's2', category: 'basket-pour-homme', price: 2,
    image_url: '/b.jpg', images: ['/b.jpg'], sizes: ['42'], outOfStockSizes: [], colors: ['Blanc'], outOfStockColors: [],
    inStock: true, description: 'Légèreté quotidienne.', isPopular: false,
  },
  {
    id: '3', name: 'Sneaker Basket Vintage', slug: 's3', category: 'sneaker', price: 3,
    image_url: '/c.jpg', images: ['/c.jpg'], sizes: ['43'], outOfStockSizes: [], colors: ['Noir'], outOfStockColors: [],
    inStock: true, description: 'Basket rétro en édition limitée.', isPopular: false,
  },
  {
    id: '4', name: 'Jean Oversize', slug: 's4', category: 'jeans-oversize', price: 4,
    image_url: '/d.jpg', images: ['/d.jpg'], sizes: ['M'], outOfStockSizes: [], colors: ['Bleu'], outOfStockColors: [],
    inStock: true, description: 'Coupe large streetwear.', isPopular: false,
  },
];

describe('Unit — E5 scoring de pertinence (Riel × normalisation)', () => {
  it('égalité exacte arrive en tête, puis « commence par », puis « contient »', () => {
    const resultats = searchCatalogProducts(CATALOGUE, 'basket');
    expect(resultats.map((p) => p.id)).toEqual(['1', '2', '3']);
    // « Basket Vintage » contient basket (score 2) mais pas « commence par » :
    // l'égalité impossible ici, l'ordre vérifie le tri par score.
  });

  it('égalité exacte du nom complet en première position', () => {
    const resultats = searchCatalogProducts(CATALOGUE, 'Basket Run Essential');
    expect(resultats[0]?.id).toBe('2');
  });

  it('correspondance par catégorie et par description fonctionnent, hors-match exclu', () => {
    const parCategorie = searchCatalogProducts(CATALOGUE, 'jeans-oversize');
    expect(parCategorie.map((p) => p.id)).toEqual(['4']);
    const parDescription = searchCatalogProducts(CATALOGUE, 'rétro');
    expect(parDescription.map((p) => p.id)).toEqual(['3']);
    expect(searchCatalogProducts(CATALOGUE, 'zzzzinconnu')).toEqual([]);
  });

  it('tri stable : scores égaux conservent l\'ordre du catalogue', () => {
    const resultats = searchCatalogProducts(CATALOGUE, 'basket-pour-homme');
    expect(resultats.map((p) => p.id)).toEqual(['1', '2']);
  });

  it('normalisation fusionnée : accents pliés et emojis ignorés dans le scoring', () => {
    const accents = searchCatalogProducts(CATALOGUE, 'BASKET');
    expect(accents.map((p) => p.id)).toEqual(['1', '2', '3']);
    const emoji = searchCatalogProducts(CATALOGUE, 'basket 🔥👟');
    expect(emoji.map((p) => p.id)).toEqual(['1', '2', '3']);
  });
});

describe('Unit — E5 suggestions navbar (adaptées E4)', () => {
  it('garde emoji : les suggestions ne s\'affichent que pour une requête normalisée non vide', async () => {
    const src = await readFile('src/components/public/layout/Navbar.tsx', 'utf-8');
    expect(src).toContain('const normalizedSuggestionQuery = normalizeProductAttribute(searchQuery);');
    expect(src).toMatch(/normalizedSuggestionQuery\.length >= 2/);
  });

  it('les suggestions propagent le contexte ?search= et n\'effacent pas le champ', async () => {
    const src = await readFile('src/components/public/layout/Navbar.tsx', 'utf-8');
    const bloc = src.slice(src.indexOf('navbar-search-suggestions'), src.indexOf('</div>', src.indexOf('navbar-search-suggestions')));
    expect(bloc).toContain('?search=');
    expect(bloc).not.toContain("setSearchQuery('')");
  });

  it('la validation propage aussi le contexte ?search= vers la fiche produit', async () => {
    const src = await readFile('src/components/public/layout/Navbar.tsx', 'utf-8');
    expect(src).toContain('`/produit/${matchedProduct.id}?search=${encodeURIComponent(searchQuery.trim())}`');
  });
});

describe('Unit — E5 no-results catégorie inline + fiche produit', () => {
  it('catégorie : modale compacte inline avec la recherche en échec + « Complète le look »', async () => {
    const src = await readFile('src/app/categorie/[slug]/category-client.tsx', 'utf-8');
    expect(src).toContain('<ArticleRequestSection variant="compact" searchQuery={searchQuery || undefined}');
    expect(src).toContain('Complète le look');
    expect(src).toMatch(/filteredProducts\.length > 0 && \(\s*<ArticleRequestSection variant="compact"/);
  });

  it('plus de redirection ?demande= vers la home (parcours inline)', async () => {
    const src = await readFile('src/app/categorie/[slug]/category-client.tsx', 'utf-8');
    expect(src).not.toContain('?demande=');
  });

  it('fiche produit : « Autres résultats » alimentés par ?search= + section compacte', async () => {
    const src = await readFile('src/app/produit/[id]/product-detail-client.tsx', 'utf-8');
    expect(src).toContain("Autres résultats pour &quot;{searchQuery}&quot;");
    expect(src).toContain("searchParams.get('search')?.trim() || ''");
    expect(src).toContain('<ArticleRequestSection variant="compact" collectionHref={`/categorie/${product.category}`} />');
  });

  it('variant compact : ouverture inline avec préremplissage de la référence', async () => {
    const src = await readFile('src/components/public/home/ArticleRequestSection.tsx', 'utf-8');
    expect(src).toContain('const openCompactArticleForm = () => {');
    expect(src).toContain('reference: searchQuery.trim().slice(0, 120)');
    expect(src).toMatch(/if \(variant === 'compact'\)/);
  });
});
