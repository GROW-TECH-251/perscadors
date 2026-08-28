import type { Metadata } from 'next';
import type { CatalogCategory, Outfit, Product } from '@/types';

// Helpers SEO serveur (Impl 9) : construisent les métadonnées par page à
// partir du catalogue, pour que titre/description/OG soient présents dans le
// HTML initial (visible par les crawlers sans JavaScript).

export const SEO_BASE_URL = 'https://perscadors.vercel.app';
export const SEO_SITE_NAME = 'HP Collection Bénin';

function absoluteUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return SEO_BASE_URL;
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  return `${SEO_BASE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

export function productMetadata(product: Product): Metadata {
  const title = `${product.name} | HP Collection Cotonou`;
  const description = product.description || `Achetez ${product.name} sur HP Collection. Livraison express au Bénin.`;
  const image = absoluteUrl(product.images?.[0] || product.image_url || '');
  const url = `${SEO_BASE_URL}/produit/${product.id}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SEO_SITE_NAME,
      images: image ? [{ url: image, alt: product.name }] : undefined,
      locale: 'fr_BJ',
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined
    }
  };
}

export function looksMetadata(outfits: Outfit[]): Metadata {
  const count = outfits.length;
  const title = 'HP Looks | Inspirations Streetwear de Vioutou à Cotonou';
  const description = `Découvrez les ${count} tenues streetwear exclusives créées par l'influenceur Vioutou à Cotonou. Ajoutez un look complet à votre panier en un clic.`;
  const fallbackImage = outfits[0]?.image || '/assets/collections/outfits/outfit2.jpeg';
  const url = `${SEO_BASE_URL}/looks`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SEO_SITE_NAME,
      images: [{ url: absoluteUrl(fallbackImage), alt: 'Les Looks de Vioutou' }],
      locale: 'fr_BJ',
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [absoluteUrl(fallbackImage)]
    }
  };
}

export function categoryMetadata(category: CatalogCategory | undefined, slug: string): Metadata {
  const name = category?.name || humanizeSlug(slug);
  const title = `${name} | HP Collection`;
  const description = category?.tagline || `Découvre la sélection premium ${name.toLowerCase()} signée HP Collection au Bénin.`;
  const image = category?.image || '';
  const url = `${SEO_BASE_URL}/categorie/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: SEO_SITE_NAME,
      images: image ? [{ url: absoluteUrl(image), alt: name }] : undefined,
      locale: 'fr_BJ',
      type: 'website'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [absoluteUrl(image)] : undefined
    }
  };
}

export function notFoundMetadata(): Metadata {
  return {
    title: 'Article introuvable | HP Collection',
    description: 'Cet article n\'est plus disponible dans le catalogue HP Collection.',
    robots: { index: false }
  };
}

function humanizeSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((value) => value.charAt(0).toUpperCase() + value.slice(1))
    .join(' ');
}
