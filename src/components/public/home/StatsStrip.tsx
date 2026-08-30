// IMP-06 — Bandeau de chiffres clés de la marque.
// Composant SERVEUR async : les 3 premiers chiffres sont DÉRIVÉS du catalogue
// réel (snapshot serveur — jamais de chiffres inventés), le 4e reprend la
// promesse de livraison réelle de la boutique. Bande éditoriale noire/or
// (identité Partie 4 de la roadmap Phase 2).

import React from 'react';
import { fetchServerCatalogSnapshot } from '@/services/publicCatalogService';

export async function StatsStrip() {
  const snapshot = await fetchServerCatalogSnapshot();

  const stats = [
    { value: String(snapshot.outfits?.length ?? 0), label: 'HP Looks exclusifs' },
    { value: String(snapshot.products?.length ?? 0), label: 'Articles premium' },
    { value: String(snapshot.categories?.length ?? 0), label: 'Catégories signature' },
    { value: '24-48h', label: 'Livraison express Cotonou' },
  ];

  return (
    <section aria-label="Chiffres clés de la boutique" className="bg-[#0A0A0A] border-y border-brand-gold/20 py-12 sm:py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center space-y-1.5">
              <p className="font-bebas text-display-md tracking-wider text-brand-gold leading-none">
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm uppercase tracking-[0.2em] text-[#EDEAE3]/60 font-medium">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
