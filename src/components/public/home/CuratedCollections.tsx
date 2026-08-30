// IMP-06 — Collections curatées « Sélection Vioutou ».
// Composant SERVEUR async : consomme le snapshot catalogue serveur (Supabase
// avec fallback statique — jamais vide au build). Met en avant les produits
// populaires réels (isPopular) sans inventer de données ; à défaut, les plus
// récents. Rendu 100% dans le HTML initial (SEO) avec liens /produit/[id].

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { fetchServerCatalogSnapshot } from '@/services/publicCatalogService';
import type { Product } from '@/types';

const CURATED_COUNT = 8;

function productImage(product: Product): string {
  if (product.images?.length) return product.images[0];
  if (product.image_url) return product.image_url;
  return '/assets/brand/logo.png';
}

export async function CuratedCollections() {
  const snapshot = await fetchServerCatalogSnapshot();
  const products = snapshot.products || [];

  const popular = products.filter((product) => product.isPopular).slice(0, CURATED_COUNT);
  const curated = popular.length >= 4 ? popular : products.slice(0, CURATED_COUNT);

  if (curated.length === 0) return null;

  return (
    <section id="selection-vioutou" className="py-16 sm:py-20 bg-brand-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-6 mb-8 sm:mb-10">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-gold">
              Sélection Vioutou
            </p>
            <h2 className="font-bebas text-display-md tracking-wider uppercase text-brand-text leading-none">
              Les pièces qui font craquer
            </h2>
          </div>
          <Link
            href="/looks"
            className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-brand-bg-alt border border-brand-gold/20 hover:border-brand-gold/40 rounded-full text-sm font-medium text-brand-text hover:text-brand-gold transition-all duration-(--motion-fast)"
          >
            Voir les HP Looks
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {curated.map((product) => (
            <Link
              key={product.id}
              href={`/produit/${product.id}`}
              className="group relative aspect-[3/4] rounded-2xl overflow-hidden border border-brand-gold/10 bg-brand-bg-alt shadow-sm hover:shadow-[0_20px_45px_-15px_rgb(0,0,0,0.4)] ring-1 ring-inset ring-brand-gold/5 hover:ring-brand-gold/25 transition-all duration-(--motion-raise) ease-out-luxe hover:-translate-y-[3px] cursor-pointer"
            >
              <div className="skeleton-media" aria-hidden="true" />
              <Image
                src={productImage(product)}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                loading="lazy"
                className="object-cover transition-transform duration-(--motion-reveal) ease-out-expo group-hover:scale-[1.08]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/85 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-10">
                <p className="text-white font-semibold text-sm sm:text-base leading-tight line-clamp-2">
                  {product.name}
                </p>
                <p className="mt-1 font-bebas tracking-wider text-brand-gold text-base sm:text-lg">
                  {product.price.toLocaleString()} FCFA
                </p>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/looks"
          className="mt-6 sm:hidden inline-flex items-center gap-2 px-5 py-2.5 bg-brand-bg-alt border border-brand-gold/20 rounded-full text-sm font-medium text-brand-text"
        >
          Voir les HP Looks
        </Link>
      </div>
    </section>
  );
}
