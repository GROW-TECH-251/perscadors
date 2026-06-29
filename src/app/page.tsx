// src/app/page.tsx
// ============================================
// Page d'Accueil Publique (Forcée Dynamique & Injectée JSON-LD Store / Local SEO Cotonou)
// ============================================

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import React from 'react';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Hero } from '@/components/home/Hero';
import { OutfitCarousel } from '@/components/home/OutfitCarousel';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { Testimonials } from '@/components/home/Testimonials';
import { FAQ } from '@/components/home/FAQ';

export default function HomePage() {
  // SEO Local Cotonou / Bénin & Données Structurées JSON-LD (schema.org)
  const storeSchema = {
    "@context": "https://schema.org",
    "@type": ["Store", "Organization", "WebSite"],
    "@id": "https://perscadors.vercel.app/#store",
    "name": "HP Collection",
    "legalName": "HP Collection / Perscadors E-commerce",
    "url": "https://perscadors.vercel.app/",
    "logo": "https://perscadors.vercel.app/images/LOGOSITE/logo.png",
    "image": "https://perscadors.vercel.app/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0036.jpg",
    "description": "Boutique premium de mode streetwear par l'influenceur Vioutou à Cotonou, Bénin. Baskets, complets, jeans oversize et claquettes VIP. Commandes instantanées via WhatsApp avec livraison express.",
    "telephone": "+22967280018",
    "priceRange": "10000 FCFA - 50000 FCFA",
    "currenciesAccepted": "XOF",
    "paymentAccepted": "Cash on Delivery, Mobile Money, Cash",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Quartier Haie Vive / Centre Ville",
      "addressLocality": "Cotonou",
      "addressRegion": "Littoral",
      "postalCode": "BP 0000",
      "addressCountry": "BJ"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 6.36536,
      "longitude": 2.41833
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        "opens": "09:00",
        "closes": "20:00"
      }
    ],
    "founder": {
      "@type": "Person",
      "name": "Vioutou",
      "jobTitle": "Influenceur & Propriétaire HP Collection",
      "url": "https://perscadors.vercel.app/"
    },
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://perscadors.vercel.app/categorie/basket-pour-homme?search={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  return (
    <PublicLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeSchema) }}
      />
      {/* 1. Section Hero (Pleine page avec espace en-tête) */}
      <Hero />
      {/* 2. Section HP Looks de Vioutou (Mes articles qui font craquer) */}
      <OutfitCarousel />
      {/* 3. Section Collections / Catégories */}
      <CategoryGrid />
      {/* 4. Section Témoignages & Preuve sociale */}
      <Testimonials />
      {/* 5. Section Foire Aux Questions (FAQ) */}
      <FAQ />
    </PublicLayout>
  );
}
