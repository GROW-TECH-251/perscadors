'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useCatalog } from '@/context/CatalogContext';
import { Outfit } from '@/types';
import { useCart } from '@/context/CartContext';
import { X, Eye, Sparkles } from 'lucide-react';

const CAROUSEL_CARD_WIDTH = 256;

export const OutfitCarousel: React.FC = () => {
  const { outfits } = useCatalog();
  const { addMultipleToCart } = useCart();
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const dragState = useRef({ isDragging: false, startX: 0, startScrollLeft: 0 });
  const isAutoPausedRef = useRef(false);

  // Performance P0 : Ne plus dupliquer 64 images (32*2) pour infinite scroll
  // Avant : [...outfits, ...outfits] → 64 images rendues d'un coup, toutes avec next/image optimization → lourd, 2-3s latence
  // Après : outfits seul (32 images) + CSS animation légère, pas de duplication DOM
  // Gain : -50% images initiales, -50% requêtes _next/image, LCP amélioré
  const displayOutfits = useMemo(() => outfits, [outfits]);

  const pauseAutoScroll = () => { isAutoPausedRef.current = true; };
  const resumeAutoScroll = () => { isAutoPausedRef.current = false; };

  const handleRecreateLook = (outfit: Outfit) => {
    addMultipleToCart(outfit.products);
    setSelectedOutfit(null);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container) return;

    pauseAutoScroll();
    dragState.current = {
      isDragging: true,
      startX: event.clientX,
      startScrollLeft: container.scrollLeft,
    };

    container.setPointerCapture(event.pointerId);
    container.style.cursor = 'grabbing';
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container || !dragState.current.isDragging) return;

    const deltaX = event.clientX - dragState.current.startX;
    container.scrollLeft = dragState.current.startScrollLeft - deltaX;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container) return;

    dragState.current.isDragging = false;
    container.style.cursor = 'grab';

    try {
      container.releasePointerCapture(event.pointerId);
    } catch {
      // pointer already released; ignore
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollRef.current;
    if (!container || Math.abs(event.deltaY) === 0) return;

    pauseAutoScroll();
    event.preventDefault();
    container.scrollLeft += event.deltaY;
  };

  // Auto-scroll JavaScript : remplace l'ancienne animation CSS
  // @keyframes scroll-carousel { translate3d(-50%) }. Celle-ci exigeait deux
  // copies identiques du contenu pour boucler sans trou ; or l'optimisation
  // "Performance P0" ne rend plus qu'une seule copie (32 images). Résultat
  // observé : la piste défilait dans le vide (image coupée, zone blanche,
  // reset brutal toutes les 28 s). Ici, on fait défiler scrollLeft par petits
  // pas (requestAnimationFrame), avec boucle propre en bout de piste, pause au
  // survol/pointer/toucher et respect de prefers-reduced-motion.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const SPEED_PX_PER_SECOND = 80;
    let rafId = 0;
    let lastTime: number | null = null;

    const step = (time: number) => {
      const elapsed = lastTime === null ? 0 : Math.min(time - lastTime, 50);
      lastTime = time;

      const current = scrollRef.current;
      if (current && !isAutoPausedRef.current && elapsed > 0) {
        const maxScroll = current.scrollWidth - current.clientWidth;
        if (maxScroll > 0) {
          const next = current.scrollLeft + (SPEED_PX_PER_SECOND * elapsed) / 1000;
          current.scrollLeft = next >= maxScroll ? 0 : next;
        }
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [outfits.length]);

  const modalOutfitPrice = selectedOutfit ? selectedOutfit.price.toLocaleString() : '0';

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
          <div className="relative w-full overflow-hidden">
            <div
              ref={scrollRef}
              onMouseEnter={pauseAutoScroll}
              onMouseLeave={resumeAutoScroll}
              onTouchStart={pauseAutoScroll}
              onTouchEnd={resumeAutoScroll}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={(event) => {
                handlePointerUp(event);
                resumeAutoScroll();
              }}
              onPointerLeave={(event) => {
                handlePointerUp(event);
                resumeAutoScroll();
              }}
              onPointerCancel={(event) => {
                handlePointerUp(event);
                resumeAutoScroll();
              }}
              onWheel={handleWheel}
              className="outfit-carousel-track flex w-max max-w-none gap-6 overflow-x-auto pb-4 select-none touch-pan-x cursor-grab active:cursor-grabbing"
            >
              {displayOutfits.map((outfit, index) => (
                <button
                  type="button"
                  key={`${outfit.id}-${index}`}
                  onClick={() => setSelectedOutfit(outfit)}
                  className="relative w-64 h-96 flex-shrink-0 group overflow-hidden rounded-xl border border-brand-gold/10 bg-brand-bg shadow-lg transition-transform duration-(--motion-fast) ease-out-expo hover:scale-[1.03] text-left"
                  style={{ width: `${CAROUSEL_CARD_WIDTH}px` }}
                >
                  <div className="skeleton-media" aria-hidden="true" />
                  <Image
                    src={outfit.image}
                    alt={outfit.name}
                    fill
                    sizes="256px"
                    priority={index < 4}
                    loading={index < 4 ? 'eager' : 'lazy'}
                    draggable={false}
                    className="object-cover transition-transform duration-(--motion-reveal) ease-out-expo group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-(--motion-smooth) flex flex-col justify-end p-6 z-10">
                    <span className="text-brand-gold font-bebas text-2xl tracking-wider uppercase leading-none">
                      {outfit.name.split(' (')[0]}
                    </span>
                    <span className="text-xs text-brand-bg-alt mt-1 flex items-center gap-1 font-semibold">
                      <Eye size={12} className="text-brand-gold" /> Inspecter ce look
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedOutfit && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={() => setSelectedOutfit(null)}
              />

              <div className="relative w-full max-w-3xl bg-brand-bg text-brand-text rounded-2xl overflow-hidden border border-brand-gold/30 shadow-2xl flex flex-col md:flex-row z-10 max-h-[90vh] overflow-y-auto md:overflow-visible">
                <button
                  type="button"
                  onClick={() => setSelectedOutfit(null)}
                  aria-label="Fermer la fenêtre de l'outfit"
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
                        {modalOutfitPrice} FCFA
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
};