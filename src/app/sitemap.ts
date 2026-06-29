import type { MetadataRoute } from 'next';
import { fetchPublicCatalogSnapshot } from '@/services/publicCatalogService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://perscadors.vercel.app';
  const snapshot = await fetchPublicCatalogSnapshot();

  // 1. Pages Principales
  const mainPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/looks`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  // 2. Catégories E-commerce
  const categoryPages: MetadataRoute.Sitemap = snapshot.categories.map((category) => ({
    url: `${baseUrl}/categorie/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  // 3. Fiches Produits Détaillées
  const productPages: MetadataRoute.Sitemap = snapshot.products.map((product) => ({
    url: `${baseUrl}/produit/${product.id}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.7,
  }));

  // 4. HP Looks de Vioutou
  const outfitPages: MetadataRoute.Sitemap = snapshot.outfits.map((outfit) => ({
    url: `${baseUrl}/looks#${outfit.id}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  return [...mainPages, ...categoryPages, ...productPages, ...outfitPages];
}
