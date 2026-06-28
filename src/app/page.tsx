// src/app/page.tsx
// ============================================
// Page d'Accueil Publique (Forcée Dynamique & Conformité Cadre Final)
// ============================================

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { PublicLayout } from '@/components/layout/PublicLayout';
import { Hero } from '@/components/home/Hero';
import { OutfitCarousel } from '@/components/home/OutfitCarousel';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { Testimonials } from '@/components/home/Testimonials';
import { FAQ } from '@/components/home/FAQ';

export default function HomePage() {
  return (
    <PublicLayout>
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
