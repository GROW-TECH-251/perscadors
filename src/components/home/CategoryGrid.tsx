'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';

interface CategoryCard {
  name: string;
  slug: string;
  image: string;
  count: string;
  tagline: string;
}

export const CategoryGrid: React.FC = () => {
  const categories: CategoryCard[] = [
    {
      name: 'Baskets Homme',
      slug: 'basket-pour-homme',
      image: '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0012.jpg',
      count: '5 Modèles Exclusive',
      tagline: 'Des kicks d\'un autre niveau pour marcher sur Cotonou.',
    },
    {
      name: 'Complets Streetwear',
      slug: 'complet-pour-homme',
      image: '/images/ARTICLES/COMPLET POUR HOMME/IMG-20251014-WA0006.jpg',
      count: '3 Ensembles Luxe',
      tagline: 'Oversize et monogrammes haut de gamme.',
    },
    {
      name: 'Jeans Oversize',
      slug: 'jean-overside-pour-homme',
      image: '/images/ARTICLES/JEAN OVERSIDE POUR HOMME/IMG-20251014-WA0037.jpg',
      count: '4 Coupes Premium',
      tagline: 'Large, structuré, coupe Margiela. Le favori de Vioutou.',
    },
    {
      name: 'Tapettes & Sandales',
      slug: 'tapettes-pour-homme',
      image: '/images/ARTICLES/TAPETTES POUR HOMME/IMG-20251014-WA0026.jpg',
      count: '3 Paires Cozy',
      tagline: 'Daim premium, style décontracté pour un statut royal.',
    },
  ];

  return (
    <section id="categories" className="py-24 bg-brand-bg scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center mb-16">
          <h2 className="font-bebas text-4xl sm:text-6xl tracking-wider text-brand-gold mb-4 uppercase">
            Trouve ton style
          </h2>
          <div className="w-20 h-1 bg-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted max-w-xl mx-auto text-base sm:text-lg">
            Explore nos collections streetwear exclusives et impose ton style dans la rue.
          </p>
        </div>

        {/* Grid cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categorie/${cat.slug}`}
              className="relative h-[450px] group rounded-2xl overflow-hidden border border-brand-gold/15 bg-brand-bg-alt flex flex-col justify-end shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] cursor-pointer"
            >
              {/* Cover Image */}
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105 group-hover:filter brightness-90"
              />

              {/* Black to gold transparent overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/30 to-transparent group-hover:from-black/90 transition-all duration-500 z-10" />

              {/* Content info */}
              <div className="relative z-20 p-6 space-y-3">
                <span className="text-xs text-brand-gold tracking-widest uppercase font-semibold">
                  {cat.count}
                </span>
                
                <div className="flex items-center justify-between">
                  <h3 className="font-bebas text-3xl tracking-wider text-white uppercase leading-none">
                    {cat.name}
                  </h3>
                  <div className="p-2 bg-brand-gold text-brand-bg rounded-full translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <ArrowUpRight size={18} />
                  </div>
                </div>

                <p className="text-sm text-brand-bg-alt/80 opacity-0 group-hover:opacity-100 max-h-0 group-hover:max-h-20 overflow-hidden transition-all duration-500 ease-in-out">
                  {cat.tagline}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
