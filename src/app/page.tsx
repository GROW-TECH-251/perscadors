// src/app/page.tsx
// ============================================
// Page d'Accueil Publique (Forcée Dynamique pour 100% de synchro)
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
      <Hero />
      <CategoryGrid />
      <OutfitCarousel />
      <Testimonials />
      <FAQ />
    </PublicLayout>
  );
}