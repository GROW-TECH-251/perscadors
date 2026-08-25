// src/app/page.tsx
// Page d'Accueil Publique — Optimisée performance (ISR 60s + dynamic imports)
// Plus de force-dynamic pour permettre cache et fluidité

export const revalidate = 60;

import React from 'react';
import dynamic from 'next/dynamic';
import { PublicLayout } from '@/components/public/layout/PublicLayout';
import { Hero } from '@/components/public/home/Hero';
import { OutfitCarousel } from '@/components/public/home/OutfitCarousel';
import { CategoryGrid } from '@/components/public/home/CategoryGrid';
import { ArticleRequestSection } from '@/components/public/home/ArticleRequestSection';
import { Testimonials } from '@/components/public/home/Testimonials';
import { FAQ } from '@/components/public/home/FAQ';
import { safeJsonLd } from '@/utils/safeJsonLd';

// Dynamic imports pour code splitting — gain perf / risque faible
// Ces composants sont lourds (carousel 64 images, grille, témoignages, FAQ, demande article)
const OutfitCarousel = dynamic(() => import('@/components/public/home/OutfitCarousel').then((m) => m.OutfitCarousel), {
  loading: () => <div className="py-24 bg-brand-bg-alt border-y border-brand-gold/10 animate-pulse h-96" />,
});
const CategoryGrid = dynamic(() => import('@/components/public/home/CategoryGrid').then((m) => m.CategoryGrid), {
  loading: () => <div className="py-24 bg-brand-bg animate-pulse h-96" />,
});
const ArticleRequestSection = dynamic(() => import('@/components/public/home/ArticleRequestSection').then((m) => m.ArticleRequestSection), {
  loading: () => <div className="py-20 bg-brand-bg-alt border-y border-brand-gold/10 animate-pulse h-64" />,
});
const Testimonials = dynamic(() => import('@/components/public/home/Testimonials').then((m) => m.Testimonials), {
  loading: () => <div className="py-24 bg-brand-bg-alt border-y border-brand-gold/10 animate-pulse h-64" />,
});
const FAQ = dynamic(() => import('@/components/public/home/FAQ').then((m) => m.FAQ), {
  loading: () => <div className="py-16 bg-brand-bg animate-pulse h-64" />,
});

export default function HomePage() {
  // SEO Local Cotonou / Bénin & Données Structurées JSON-LD (schema.org)
  const storeSchema = {
    "@context": "https://schema.org",
    "@type": ["Store", "Organization", "WebSite"],
    "@id": "https://perscadors.vercel.app/#store",
    "name": "HP Collection",
    "legalName": "HP Collection / Perscadors E-commerce",
    "url": "https://perscadors.vercel.app/",
    "logo": "https://perscadors.vercel.app/assets/brand/logo.png",
    "image": "https://perscadors.vercel.app/assets/collections/articles/BASKET POUR HOMME/IMG-20251014-WA0036.jpg",
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
        dangerouslySetInnerHTML={{ __html: safeJsonLd(storeSchema) }}
      />
      {/* 1. Section Hero (Pleine page avec espace en-tête) */}
      <Hero />
      {/* 2. Section HP Looks de Vioutou (Mes articles qui font craquer) */}
      <OutfitCarousel />
      {/* 3. Section Collections / Catégories */}
      <CategoryGrid />
      {/* 3b. Section Demande d'article non trouvé — placée sous catégories pour meilleur parcours UX */}
      <ArticleRequestSection />
      {/* 4. Section Témoignages & Preuve sociale */}
      <Testimonials />
      {/* 5. Section Foire Aux Questions (FAQ) */}
      <FAQ />
    </PublicLayout>
  );
}
