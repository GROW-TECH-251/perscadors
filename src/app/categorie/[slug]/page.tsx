'use client';

import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { useCatalog } from '@/context/CatalogContext';
import { Product, Size } from '@/types';
import { SlidersHorizontal, ArrowLeft } from 'lucide-react';

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { products, categories, getProductsByCategory } = useCatalog();
  const slug = params.slug as string;
  const searchQuery = searchParams.get('search') || '';

  const rawProducts = useMemo(() => getProductsByCategory(slug), [getProductsByCategory, slug]);
  const activeCategory = useMemo(() => categories.find((category) => category.slug === slug), [categories, slug]);
  const categoryTitle = activeCategory?.name || slug.replace(/-/g, ' ');

  const [selectedSizes, setSelectedSizes] = useState<Size[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  const uniqueSizes = useMemo(
    () => Array.from(new Set(rawProducts.flatMap((product) => product.sizes))).sort(),
    [rawProducts]
  );
  const uniqueColors = useMemo(
    () => Array.from(new Set(rawProducts.flatMap((product) => product.colors))).sort(),
    [rawProducts]
  );

  const filteredProducts = useMemo<Product[]>(() => {
    let result = [...rawProducts];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = products.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query)
      );
    }

    if (selectedSizes.length > 0) {
      result = result.filter((product) =>
        product.sizes.some((size) => selectedSizes.includes(size))
      );
    }

    if (selectedColors.length > 0) {
      result = result.filter((product) =>
        product.colors.some((color) => selectedColors.includes(color))
      );
    }

    return result;
  }, [products, rawProducts, searchQuery, selectedSizes, selectedColors]);

  const toggleSize = (size: Size) => {
    setSelectedSizes((currentSizes) =>
      currentSizes.includes(size)
        ? currentSizes.filter((currentSize) => currentSize !== size)
        : [...currentSizes, size]
    );
  };

  const toggleColor = (color: string) => {
    setSelectedColors((currentColors) =>
      currentColors.includes(color)
        ? currentColors.filter((currentColor) => currentColor !== color)
        : [...currentColors, color]
    );
  };

  const resetFilters = () => {
    setSelectedSizes([]);
    setSelectedColors([]);
  };

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/#categories"
            className="flex items-center gap-2 text-brand-text-muted hover:text-brand-gold transition-colors font-bebas text-lg uppercase tracking-wider"
          >
            <ArrowLeft size={16} /> Retour aux collections
          </Link>
          <span className="text-sm text-brand-text-muted bg-brand-bg-alt px-3 py-1 rounded-full border border-brand-gold/10">
            {filteredProducts.length} Article{filteredProducts.length > 1 ? 's' : ''} trouvé{filteredProducts.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="mb-12">
          <h1 className="font-bebas text-5xl sm:text-7xl text-brand-gold uppercase tracking-wider leading-none">
            {categoryTitle}
          </h1>
          {searchQuery && (
            <p className="text-brand-text-muted mt-2">
              Résultats de recherche pour : &quot;<span className="text-brand-text font-semibold">{searchQuery}</span>&quot;
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          <aside className="hidden lg:block bg-brand-bg-alt border border-brand-gold/15 p-6 rounded-2xl space-y-8 sticky top-24 shadow-sm">
            <div className="flex items-center justify-between border-b border-brand-gold/10 pb-4">
              <h2 className="font-bebas text-2xl tracking-wider uppercase text-brand-text flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-brand-gold" /> Filtres
              </h2>
              {(selectedSizes.length > 0 || selectedColors.length > 0) && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-brand-gold hover:underline cursor-pointer"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-bebas text-lg tracking-wider text-brand-text-muted uppercase">Tailles</h3>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((size) => {
                  const isSelected = selectedSizes.includes(size);
                  return (
                    <button
                      key={size}
                      onClick={() => toggleSize(size)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-brand-gold border-brand-gold text-brand-bg shadow'
                          : 'border-brand-gold/20 hover:border-brand-gold/60 text-brand-text bg-brand-bg'
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-brand-gold/10">
              <h3 className="font-bebas text-lg tracking-wider text-brand-text-muted uppercase">Couleurs</h3>
              <div className="flex flex-wrap gap-2">
                {uniqueColors.map((color) => {
                  const isSelected = selectedColors.includes(color);
                  return (
                    <button
                      key={color}
                      onClick={() => toggleColor(color)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-brand-gold border-brand-gold text-brand-bg shadow'
                          : 'border-brand-gold/20 hover:border-brand-gold/60 text-brand-text bg-brand-bg'
                      }`}
                    >
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="lg:hidden flex justify-between items-center gap-4 mb-4">
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="flex-grow flex items-center justify-center gap-2 py-3 border border-brand-gold/20 bg-brand-bg-alt rounded-lg font-bebas text-lg uppercase tracking-wider text-brand-text hover:border-brand-gold/60"
            >
              <SlidersHorizontal size={18} className="text-brand-gold" /> Filtrer les articles
            </button>
          </div>

          <div className="lg:col-span-3">
            {filteredProducts.length === 0 ? (
              <div className="py-24 text-center space-y-4 bg-brand-bg-alt rounded-2xl border border-brand-gold/10">
                <span className="text-4xl block">🔍</span>
                <p className="font-bebas text-2xl text-brand-text-muted uppercase">Aucun article ne correspond à votre sélection.</p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2 bg-brand-gold hover:bg-brand-gold-light text-brand-bg rounded font-bebas text-lg uppercase tracking-wider transition-colors"
                >
                  Voir toute la collection
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-8">
                {filteredProducts.map((product) => (
                  <Link
                    key={product.id}
                    href={`/produit/${product.id}`}
                    className="group bg-brand-bg-alt border border-brand-gold/10 rounded-2xl overflow-hidden shadow-md flex flex-col justify-between hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]"
                  >
                    <div className="relative w-full aspect-[3/4] overflow-hidden bg-brand-bg">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />

                      {!product.inStock && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                          <span className="bg-red-600 text-white font-bebas text-lg sm:text-2xl uppercase tracking-widest px-4 py-2 rounded transform -rotate-12 border border-white/20 shadow-xl">
                            Rupture de Stock
                          </span>
                        </div>
                      )}

                      {product.isPopular && product.inStock && (
                        <div className="absolute top-3 left-3 bg-brand-gold text-brand-bg text-[10px] sm:text-xs font-bold uppercase px-2 py-1 rounded tracking-wider shadow z-10">
                          Best Seller 🔥
                        </div>
                      )}
                    </div>

                    <div className="p-4 sm:p-5 flex-grow flex flex-col justify-between gap-3">
                      <div>
                        <span className="text-[10px] sm:text-xs text-brand-text-muted uppercase tracking-wider font-semibold block mb-1">
                          {product.category.replace(/-/g, ' ')}
                        </span>
                        <h3 className="font-bebas text-lg sm:text-2xl text-brand-text tracking-wide uppercase line-clamp-2 leading-tight group-hover:text-brand-gold transition-colors">
                          {product.name}
                        </h3>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-brand-gold/5 mt-auto">
                        <span className="font-bold text-sm sm:text-lg text-brand-gold">
                          {product.price.toLocaleString()} FCFA
                        </span>
                        <span className="text-xs text-brand-text-muted border border-brand-gold/15 rounded px-2 py-0.5 group-hover:border-brand-gold group-hover:text-brand-gold transition-colors">
                          Détails
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsFilterDrawerOpen(false)}
            />
            <div className="relative w-full max-w-xs bg-brand-bg border-r border-brand-gold/25 p-6 flex flex-col justify-between h-full shadow-2xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-brand-gold/15 pb-4">
                  <h2 className="font-bebas text-2xl tracking-wider text-brand-text">Filtres</h2>
                  <button
                    type="button"
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="p-1 hover:bg-brand-bg-alt rounded-full text-brand-text-muted"
                    aria-label="Fermer les filtres"
                  >
                    <ArrowLeft size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bebas text-lg tracking-wider text-brand-text-muted uppercase">Tailles</h3>
                  <div className="flex flex-wrap gap-2">
                    {uniqueSizes.map((size) => {
                      const isSelected = selectedSizes.includes(size);
                      return (
                        <button
                          key={size}
                          onClick={() => toggleSize(size)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded border ${
                            isSelected
                              ? 'bg-brand-gold border-brand-gold text-brand-bg'
                              : 'border-brand-gold/20 text-brand-text bg-brand-bg-alt'
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bebas text-lg tracking-wider text-brand-text-muted uppercase">Couleurs</h3>
                  <div className="flex flex-wrap gap-2">
                    {uniqueColors.map((color) => {
                      const isSelected = selectedColors.includes(color);
                      return (
                        <button
                          key={color}
                          onClick={() => toggleColor(color)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${
                            isSelected
                              ? 'bg-brand-gold border-brand-gold text-brand-bg'
                              : 'border-brand-gold/20 text-brand-text bg-brand-bg-alt'
                          }`}
                        >
                          {color}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-3 border-t border-brand-gold/15 pt-4">
                <button
                  onClick={resetFilters}
                  className="w-full py-2 border border-brand-gold/30 hover:border-brand-gold font-bebas text-md tracking-wider rounded text-brand-text uppercase"
                >
                  Vider les filtres
                </button>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-full py-3 bg-brand-gold text-brand-bg font-bebas text-lg tracking-widest rounded uppercase"
                >
                  Appliquer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}