// src/app/robots.ts
// Consignes d'Exploration pour Googlebot — ISR 1 jour

export const revalidate = 86400;

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
    sitemap: 'https://perscadors.vercel.app/sitemap.xml',
  };
}
