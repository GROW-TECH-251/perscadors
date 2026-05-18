import React from 'react';
import { Hero } from '@/components/home/Hero';
import { OutfitCarousel } from '@/components/home/OutfitCarousel';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { Testimonials } from '@/components/home/Testimonials';
import { FAQ } from '@/components/home/FAQ';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Sections in correct order */}
      <Hero />
      <OutfitCarousel />
      <CategoryGrid />
      <Testimonials />
      <FAQ />
    </div>
  );
}
