// src/app/robots.ts
// ============================================
// Consignes d'Exploration pour Googlebot (Forcé Dynamique pour esquiver le cache CDN Vercel)
// ============================================

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
