'use client';

// Carte catégorie publique — extraction P1-1B/1C (finalisation 10/2026) de la
// grille d'accueil : style historique réutilisé À L'IDENTIQUE par la grille
// d'accueil et la page « Toutes les catégories » (/categories), pour une
// seule source de vérité visuelle.

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import type { CatalogCategory } from '@/types';

export function CategoryCard({ category }: { category: CatalogCategory }) {
  return (
    <Link
      href={`/categorie/${category.slug}`}
      className="relative h-[460px] group rounded-3xl overflow-hidden border border-brand-gold/10 bg-brand-bg-alt flex flex-col justify-end shadow-2xl hover:shadow-[0_30px_60px_-15px_rgb(0,0,0,0.45)] ring-1 ring-inset ring-brand-gold/5 hover:ring-brand-gold/25 transition-all duration-(--motion-raise) ease-out-luxe hover:scale-[1.015] hover:-translate-y-[3px] cursor-pointer will-change-transform"
    >
      <div className="skeleton-media" aria-hidden="true" />
      <Image
        src={category.image}
        alt={category.name}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        className="object-cover transition-all duration-(--motion-reveal) ease-out-expo group-hover:scale-[1.12] group-hover:brightness-[0.82] group-hover:saturate-[1.08]"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/38 to-transparent group-hover:from-[#0A0A0A] group-hover:via-black/62 transition-all duration-(--motion-raise) z-10" />

      <div className="relative z-20 p-7 space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="font-bebas text-[29px] sm:text-3xl tracking-wider text-white uppercase leading-none drop-shadow-sm">
            {category.name}
          </h3>
          <div className="p-2.5 bg-brand-gold text-brand-bg rounded-full translate-y-1.5 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-(--motion-smooth) ease-out-luxe shadow-md">
            <ArrowUpRight size={19} />
          </div>
        </div>

        <p className="text-[13px] leading-snug text-brand-bg-alt/90 opacity-0 group-hover:opacity-100 max-h-0 group-hover:max-h-[72px] overflow-hidden transition-all duration-(--motion-raise) ease-out-expo delay-[60ms]">
          {category.tagline}
        </p>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-brand-gold/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-(--motion-smooth) z-30" />
    </Link>
  );
}
