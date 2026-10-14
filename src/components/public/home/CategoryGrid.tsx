'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useCatalog } from '@/context/CatalogContext';
import { CategoryCard } from '@/components/public/CategoryCard';
import { selectHomeCategories } from '@/lib/publicCategoryOrder';

export const CategoryGrid: React.FC = () => {
  const { categories } = useCatalog();

  // P1-1B (finalisation 10/2026) — les 8 premières catégories selon l'ordre
  // défini dans l'admin (tri par position puis découpe). Les suivantes
  // restent accessibles via la page « Toutes les catégories » (1C).
  const homeCategories = React.useMemo(
    () => selectHomeCategories(categories),
    [categories]
  );

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
              {homeCategories.map((category) => (
                <CategoryCard key={category.slug} category={category} />
              ))}
            </div>

            {/* P1-1C — accès aux catégories au-delà des 8 mises en avant */}
            {categories.length > homeCategories.length && (
              <div className="mt-12 text-center">
                <Link
                  href="/categories"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-brand-gold text-brand-bg rounded-full text-sm font-semibold uppercase tracking-wider shadow-lg hover:shadow-xl hover:bg-brand-gold/90 hover:scale-[1.03] transition-all duration-(--motion-fast) ease-out-luxe"
                >
                  <span>Voir toutes les catégories</span>
                  <ArrowUpRight size={16} />
                </Link>
              </div>
            )}

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
