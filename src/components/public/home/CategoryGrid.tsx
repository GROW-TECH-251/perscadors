'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';

export const CategoryGrid: React.FC = () => {
  const { categories } = useCatalog();

  return (
    <section id="categories" className="py-24 bg-brand-bg scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-bebas text-4xl sm:text-6xl tracking-wider text-brand-gold mb-4 uppercase">
            Trouve ton style
          </h2>
          <div className="w-20 h-1 bg-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted max-w-xl mx-auto text-base sm:text-lg">
            Explore nos collections streetwear exclusives et impose ton style dans la rue.
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-16 bg-brand-bg-alt rounded-2xl border border-brand-gold/10">
            <p className="font-bebas text-2xl text-brand-text uppercase">Aucune collection disponible</p>
            <p className="text-brand-text-muted mt-2">Ajoute des catégories visibles depuis l&apos;admin pour alimenter la vitrine.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {categories.map((category) => (
                <Link
                  key={category.slug}
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
              ))}
            </div>

            {/* CTA Article non trouvé — placé sous les catégories pour meilleur parcours UX */}
            <div className="mt-12 text-center">
              <p className="text-brand-text-muted text-sm mb-3">Vous ne trouvez pas ce que vous cherchez ?</p>
              <Link
                href="#article-request"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-bg-alt border border-brand-gold/20 hover:border-brand-gold/40 hover:bg-brand-gold/5 rounded-full text-sm font-medium text-brand-text hover:text-brand-gold transition-all duration-(--motion-fast)"
              >
                <span>Ajoutez votre demande</span>
                <ArrowUpRight size={16} />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
};
