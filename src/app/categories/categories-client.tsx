'use client';

// P1-1C (finalisation 10/2026) — « Toutes les catégories » : toutes les
// catégories visibles, dans l'ordre défini par l'admin (position croissante),
// cartes identiques à la grille d'accueil. Chaque carte mène aux produits de
// la catégorie (/categorie/[slug]).

import React from 'react';
import { useCatalog } from '@/context/CatalogContext';
import { CategoryCard } from '@/components/public/CategoryCard';
import { sortCategoriesByPosition } from '@/lib/publicCategoryOrder';

export default function CategoriesPage() {
  const { categories } = useCatalog();
  const orderedCategories = React.useMemo(
    () => sortCategoriesByPosition(categories),
    [categories]
  );

  return (
    <section id="all-categories" className="py-24 bg-brand-bg scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-bebas text-4xl sm:text-6xl tracking-wider text-brand-gold mb-4 uppercase">
            Toutes les catégories
          </h1>
          <div className="w-20 h-1 bg-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted max-w-xl mx-auto text-base sm:text-lg">
            Explore l&apos;ensemble de nos collections streetwear, dans l&apos;ordre de la vitrine.
          </p>
        </div>

        {orderedCategories.length === 0 ? (
          <div className="text-center py-16 bg-brand-bg-alt rounded-2xl border border-brand-gold/10">
            <p className="font-bebas text-2xl text-brand-text uppercase">Aucune collection disponible</p>
            <p className="text-brand-text-muted mt-2">Ajoute des catégories visibles depuis l&apos;admin pour alimenter la vitrine.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {orderedCategories.map((category) => (
              <CategoryCard key={category.slug} category={category} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
