import type { AdminCategory, AdminProduct, AdminOutfit } from '@/admin/types';
import { products as fallbackProducts } from '@/data/products';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import type { CatalogCategory, Outfit, Product, Size } from '@/types';

export type CatalogSource = 'fallback' | 'supabase';

export interface PublicCatalogSnapshot {
  products: Product[];
  categories: CatalogCategory[];
  outfits: Outfit[];
  source: CatalogSource;
}

interface CategoryMeta {
  name: string;
  tagline: string;
  fallbackImage: string;
}

const DEFAULT_PRODUCT_IMAGE = '/images/LOGOSITE/logo.png';

const CATEGORY_META_MAP: Record<string, CategoryMeta> = {
  'basket-pour-homme': {
    name: 'Baskets Homme',
    tagline: 'Des kicks premium pour imposer ton style partout à Cotonou.',
    fallbackImage: '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0012.jpg'
  },
  'complet-pour-homme': {
    name: 'Complets Streetwear',
    tagline: 'Oversize, monogrammes et ensembles premium validés par Vioutou.',
    fallbackImage: '/images/ARTICLES/COMPLET POUR HOMME/IMG-20251014-WA0006.jpg'
  },
  'jean-overside-pour-homme': {
    name: 'Jeans Oversize',
    tagline: 'Des coupes larges et premium pensées pour les vrais looks streetwear.',
    fallbackImage: '/images/ARTICLES/JEAN OVERSIDE POUR HOMME/IMG-20251014-WA0037.jpg'
  },
  'tapettes-pour-homme': {
    name: 'Tapettes & Sandales',
    tagline: 'Confort premium, daim et finitions haut de gamme pour les sorties chill.',
    fallbackImage: '/images/ARTICLES/TAPETTES POUR HOMME/IMG-20251014-WA0026.jpg'
  }
};

const OUTFIT_STYLING_NAMES = [
  'Urban Royalty', 'Denim Deluxe', 'Luxe Streetwear', 'Minimalist Vibe',
  'Margiela Flow', 'Cozy Street Wear', 'Sport Runner Elite', 'Benin Trendsetter',
  'Gold Accented King', 'Classic HP Drip', 'Casual Linen Breeze', 'Oversized Monogram',
  'Shadow Black Street', 'Retro Hype Style', 'Modern Safari', 'Dapper Street Boy',
  'Golden Hour Glow', 'VIP Influencer Look', 'Clean Slate White', 'Heavy Cotton Comfort',
  'Dripping In Gold', 'Sunset Vibe Outfit', 'Summer Suede Vibe', 'Street Silhouette',
  'High Top Classic', 'Cargo Explorer', 'Monochrome Hype', 'Luxe Cozy Day',
  'Signature HP Drip', 'Elegance & Flow', 'Streetwear Heritage', 'Urban Legend'
];

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeSizes(values: string[] | null | undefined): Size[] {
  return (values || []).filter(Boolean) as Size[];
}

function getProductImage(product: Pick<Product, 'image_url' | 'images' | 'category'>): string {
  if (product.image_url) {
    return product.image_url;
  }

  if (product.images?.[0]) {
    return product.images[0];
  }

  return CATEGORY_META_MAP[product.category]?.fallbackImage || DEFAULT_PRODUCT_IMAGE;
}

function normalizeFallbackProducts(): Product[] {
  return fallbackProducts.map((product) => ({
    ...product,
    image_url: product.image_url || product.images[0] || DEFAULT_PRODUCT_IMAGE,
    images: product.images?.length ? product.images : [product.image_url || DEFAULT_PRODUCT_IMAGE],
    outOfStockSizes: product.outOfStockSizes || [],
    outOfStockColors: product.outOfStockColors || [],
    isPopular: Boolean(product.isPopular),
    inStock: Boolean(product.inStock)
  }));
}

function normalizeAdminProduct(product: AdminProduct): Product {
  const baseImage = product.image_url || CATEGORY_META_MAP[product.category]?.fallbackImage || DEFAULT_PRODUCT_IMAGE;
  const normalizedSizes = normalizeSizes(product.sizes);

  return {
    id: String(product.id),
    name: product.name,
    slug: slugify(product.name),
    category: product.category,
    price: product.price,
    image_url: baseImage,
    images: [baseImage],
    sizes: normalizedSizes,
    outOfStockSizes: [],
    colors: product.colors || [],
    outOfStockColors: [],
    inStock: product.stock > 0,
    description: product.description || 'Produit premium HP Collection.',
    isPopular: Boolean(product.badge) || product.demand > 10
  };
}

function humanizeCategory(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1))
    .join(' ');
}

function buildCountLabel(count: number): string {
  return `${count} produit${count > 1 ? 's' : ''}`;
}

function buildDerivedCategory(slug: string, products: Product[]): CatalogCategory {
  const meta = CATEGORY_META_MAP[slug];
  const categoryProducts = products.filter((product) => product.category === slug);
  const categoryImage = categoryProducts[0]?.images[0] || meta?.fallbackImage || DEFAULT_PRODUCT_IMAGE;

  return {
    name: meta?.name || humanizeCategory(slug),
    slug,
    image: categoryImage,
    count: categoryProducts.length,
    countLabel: buildCountLabel(categoryProducts.length),
    tagline: meta?.tagline || `Découvre notre sélection premium de ${humanizeCategory(slug).toLowerCase()}.`
  };
}

function buildCategoriesFromProducts(products: Product[]): CatalogCategory[] {
  const productCategories = Array.from(new Set(products.map((product) => product.category)));
  const orderedSlugs = [
    ...Object.keys(CATEGORY_META_MAP).filter((slug) => productCategories.includes(slug)),
    ...productCategories.filter((slug) => !Object.keys(CATEGORY_META_MAP).includes(slug))
  ];

  return orderedSlugs.map((slug) => buildDerivedCategory(slug, products));
}

function mergeCategoriesWithProducts(
  products: Product[],
  categories: AdminCategory[]
): CatalogCategory[] {
  if (categories.length === 0) {
    return buildCategoriesFromProducts(products);
  }

  const mappedCategories = categories.map((category) => {
    const derivedCategory = buildDerivedCategory(category.category, products);

    return {
      ...derivedCategory,
      name: category.name || derivedCategory.name,
      image: category.image_url || derivedCategory.image,
      tagline: category.description || derivedCategory.tagline
    };
  });

  const knownSlugs = new Set(mappedCategories.map((category) => category.slug));
  const missingCategories = buildCategoriesFromProducts(products).filter(
    (category) => !knownSlugs.has(category.slug)
  );

  return [...mappedCategories, ...missingCategories];
}

function buildOutfitsFromProducts(products: Product[]): Outfit[] {
  const catalogProducts = products.length > 0 ? products : normalizeFallbackProducts();

  const pickProducts = (indexes: number[]): Product[] =>
    indexes.map((index) => catalogProducts[index % catalogProducts.length]);

  return Array.from({ length: 32 }, (_, arrayIndex) => {
    const visualIndex = arrayIndex + 1;

    let associatedProducts = pickProducts([0, 5]);
    if (visualIndex % 4 === 0) {
      associatedProducts = pickProducts([1, 8, 11]);
    } else if (visualIndex % 4 === 1) {
      associatedProducts = pickProducts([0, 9]);
    } else if (visualIndex % 4 === 2) {
      associatedProducts = pickProducts([2, 6, 11]);
    } else {
      associatedProducts = pickProducts([4, 7, 12]);
    }

    const totalPrice = associatedProducts.reduce((sum, product) => sum + product.price, 0);

    return {
      id: `outfit-${visualIndex}`,
      name: `${OUTFIT_STYLING_NAMES[arrayIndex % OUTFIT_STYLING_NAMES.length]} (Look #${visualIndex})`,
      image: `/images/OUTFITCOLLECTION/outfit${visualIndex}.jpeg`,
      price: totalPrice,
      products: associatedProducts
    };
  });
}

export function getFallbackCatalogSnapshot(): PublicCatalogSnapshot {
  const products = normalizeFallbackProducts();
  const categories = buildCategoriesFromProducts(products);
  const outfits = buildOutfitsFromProducts(products);

  return {
    products,
    categories,
    outfits,
    source: 'fallback'
  };
}

export async function fetchPublicCatalogSnapshot(): Promise<PublicCatalogSnapshot> {
  if (!isSupabaseConfigured || !supabase) {
    return getFallbackCatalogSnapshot();
  }

  const [productsResponse, categoriesResponse, outfitsResponse] = await Promise.all([
    supabase
      .from('products')
      .select('*')
      .eq('visible', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('*')
      .eq('visible', true)
      .order('position', { ascending: true }),
    supabase
      .from('outfits')
      .select('*')
      .eq('visible', true)
      .order('created_at', { ascending: false })
  ]);

  if (productsResponse.error) {
    console.error('Erreur chargement catalogue public:', productsResponse.error);
    return getFallbackCatalogSnapshot();
  }

  const normalizedProducts = ((productsResponse.data || []) as AdminProduct[]).map(normalizeAdminProduct);
  const normalizedCategories = categoriesResponse.error
    ? buildCategoriesFromProducts(normalizedProducts)
    : mergeCategoriesWithProducts(normalizedProducts, (categoriesResponse.data || []) as AdminCategory[]);

  // Pôle 5 / Module HPB : Résolution dynamique des outfits Supabase avec fallback statique
  let normalizedOutfits: Outfit[] = [];
  if (!outfitsResponse.error && outfitsResponse.data && outfitsResponse.data.length > 0) {
    normalizedOutfits = (outfitsResponse.data as AdminOutfit[]).map((outfitRow) => {
      const productIds = Array.isArray(outfitRow.product_ids) ? outfitRow.product_ids : [];
      const outfitProducts = productIds
        .map((id) => normalizedProducts.find((p) => p.id === String(id)))
        .filter(Boolean) as Product[];

      const calculatedPrice = outfitProducts.reduce((sum, p) => sum + p.price, 0);
      const finalPrice = outfitRow.custom_price !== null && outfitRow.custom_price !== undefined ? Number(outfitRow.custom_price) : calculatedPrice;

      return {
        id: String(outfitRow.id),
        name: outfitRow.name,
        image: outfitRow.image_url || '/images/LOGOSITE/logo.png',
        price: finalPrice,
        products: outfitProducts
      };
    });
  } else {
    normalizedOutfits = buildOutfitsFromProducts(normalizedProducts);
  }

  return {
    products: normalizedProducts,
    categories: normalizedCategories,
    outfits: normalizedOutfits,
    source: 'supabase'
  };
}

export function findCatalogProductById(products: Product[], id: string): Product | null {
  return products.find((product) => product.id === id || product.slug === id) || null;
}

export function findCatalogProductsByCategory(products: Product[], categorySlug: string): Product[] {
  return products.filter((product) => product.category === categorySlug);
}

export function searchCatalogProducts(products: Product[], query: string): Product[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return products;
  }

  return products.filter((product) => {
    return (
      product.name.toLowerCase().includes(normalizedQuery) ||
      product.category.toLowerCase().includes(normalizedQuery) ||
      product.description.toLowerCase().includes(normalizedQuery)
    );
  });
}

export function getCatalogProductImage(product: Product): string {
  return getProductImage(product);
}
