'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import { useCatalog } from '@/context/CatalogContext';
import { Outfit } from '@/types';
import { useCart } from '@/context/CartContext';
import { X, Eye, Sparkles } from 'lucide-react';

export const OutfitCarousel: React.FC = () => {
  const { outfits } = useCatalog();
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const { addMultipleToCart } = useCart();

  const duplicatedOutfits = useMemo(() => [...outfits, ...outfits], [outfits]);

  const handleRecreateLook = (outfit: Outfit) => {
    addMultipleToCart(outfit.products);
    setSelectedOutfit(null);
  };

  return (
    <section id="carousel-outfits" className="py-24 bg-brand-bg-alt border-y border-brand-gold/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 text-center">
        <h2 className="font-bebas text-4xl sm:text-6xl tracking-wider text-brand-gold mb-4 uppercase">
          Mes outfits qui font craquer
        </h2>
        <p className="text-brand-text-muted max-w-xl mx-auto text-base sm:text-lg">
          Vioutou t&apos;a sélectionné les looks les plus chauds du moment. Clique sur un outfit pour l&apos;inspecter ou l&apos;ajouter à ton panier d&apos;un coup !
        </p>
      </div>

      {outfits.length === 0 ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-16 bg-brand-bg rounded-2xl border border-brand-gold/10">
            <p className="font-bebas text-2xl text-brand-text uppercase">Aucun look disponible</p>
            <p className="text-brand-text-muted mt-2">Ajoute des produits visibles pour générer automatiquement les outfits.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="relative w-full flex items-center cursor-pointer select-none">
            <div className="animate-carousel-strip">
              {duplicatedOutfits.map((outfit, index) => (
                <div
                  key={`${outfit.id}-${index}`}
                  onClick={() => setSelectedOutfit(outfit)}
                  className="relative w-64 h-96 flex-shrink-0 group overflow-hidden rounded-xl border border-brand-gold/10 bg-brand-bg shadow-lg transition-transform duration-300 hover:scale-[1.03]"
                >
                  <Image
                    src={outfit.image}
                    alt={outfit.name}
                    fill
                    sizes="256px"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6 z-10">
                    <span className="text-brand-gold font-bebas text-2xl tracking-wider uppercase leading-none">
                      {outfit.name.split(' (')[0]}
                    </span>
                    <span className="text-xs text-brand-bg-alt mt-1 flex items-center gap-1 font-semibold">
                      <Eye size={12} className="text-brand-gold" /> Inspecter ce look
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedOutfit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setSelectedOutfit(null)}
              />

              <div className="relative w-full max-w-3xl bg-brand-bg text-brand-text rounded-2xl overflow-hidden border border-brand-gold/30 shadow-2xl flex flex-col md:flex-row z-10 max-h-[90vh] md:max-h-none overflow-y-auto md:overflow-visible">
                <button
                  onClick={() => setSelectedOutfit(null)}
                  className="absolute top-4 right-4 z-20 p-2 bg-[#0A0A0A]/60 hover:bg-brand-gold hover:text-brand-bg text-white rounded-full transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>

                <div className="relative w-full md:w-1/2 h-80 md:h-[500px]">
                  <Image
                    src={selectedOutfit.image}
                    alt={selectedOutfit.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0A0A0A]/90 to-transparent p-6 text-white md:hidden">
                    <h3 className="font-bebas text-3xl tracking-wider text-brand-gold">{selectedOutfit.name}</h3>
                  </div>
                </div>

                <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                  <div>
                    <span className="hidden md:inline-block font-bebas text-sm tracking-widest text-brand-gold uppercase bg-brand-gold/10 px-3 py-1 rounded mb-3">
                      Outfit Collection 🔥
                    </span>
                    <h3 className="hidden md:block font-bebas text-4xl tracking-wider leading-tight text-brand-text">
                      {selectedOutfit.name}
                    </h3>
                    <p className="text-sm text-brand-text-muted mt-2">
                      Cet outfit est composé de pièces streetwear HP Collection exclusives sélectionnées par Vioutou :
                    </p>

                    <div className="mt-6 space-y-4 max-h-48 md:max-h-none overflow-y-auto pr-1">
                      {selectedOutfit.products.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-brand-bg-alt rounded-lg border border-brand-gold/5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-14 overflow-hidden rounded bg-brand-bg flex-shrink-0">
                              <Image
                                src={product.images[0]}
                                alt={product.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <h4 className="font-bebas text-lg leading-tight">{product.name}</h4>
                              <span className="text-xs text-brand-text-muted uppercase tracking-wider block">
                                {product.category.replace(/-/g, ' ')}
                              </span>
                            </div>
                          </div>
                          <div className="font-bold text-sm text-brand-gold">
                            {product.price.toLocaleString()} FCFA
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-brand-gold/10">
                    <div className="flex justify-between items-center text-lg">
                      <span className="font-bebas text-brand-text-muted">Total du Look</span>
                      <span className="text-2xl font-bold text-brand-gold">
                        {selectedOutfit.price.toLocaleString()} FCFA
                      </span>
                    </div>

                    <button
                      onClick={() => handleRecreateLook(selectedOutfit)}
                      className="w-full py-4 bg-brand-gold hover:bg-brand-gold-light text-[#0A0A0A] font-bebas text-xl uppercase tracking-widest rounded transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles size={20} />
                      Recréer ce look
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}