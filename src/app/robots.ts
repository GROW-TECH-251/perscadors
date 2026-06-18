import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/categorie/', '/looks', '/produit/'],
        disallow: ['/admin', '/admin/'],
      },
    ],
    sitemap: undefined,
  };
}