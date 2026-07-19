// src/components/checkout/StepRecap.tsx
// ============================================
// Étape 1 — Récapitulatif panier
// ============================================

'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface StepRecapProps {
  onNext: () => void;
  onClose: () => void;
}

export function StepRecap({ onNext, onClose }: StepRecapProps) {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();

  return (
    <div className="flex h-full flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0">
        {cartItems.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center py-16 space-y-4">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
              <ShoppingBag size={28} />
            </div>
            <div>
              <h3 className="font-bebas text-2xl tracking-wider text-brand-text uppercase">
                Ton panier est vide
              </h3>
              <p className="text-sm text-brand-text-muted mt-2">
                Ajoute quelques pièces à ton panier pour lancer le tunnel de commande premium.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl bg-brand-gold text-[#0A0A0A] font-bebas uppercase tracking-widest hover:bg-brand-gold-light transition-colors"
            >
              Continuer mes achats
            </button>
          </div>
        ) : (
          cartItems.map((item) => (
            <div
              key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
              className="rounded-2xl border border-brand-gold/10 bg-brand-bg-alt p-4 shadow-sm"
            >
              <div className="flex gap-4">
                <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-brand-bg flex-shrink-0">
                  <Image
                    src={item.product.image_url || item.product.images[0]}
                    alt={item.product.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bebas text-lg tracking-wide text-brand-text uppercase truncate">
                        {item.product.name}
                      </p>
                      <p className="text-xs text-brand-text-muted mt-1">
                        Taille {item.selectedSize} • {item.selectedColor}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor)}
                      className="relative z-10 p-2 rounded-full hover:bg-red-50 text-brand-text-muted hover:text-red-500 transition-colors"
                      aria-label="Supprimer l'article"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-4">
                    <div className="inline-flex items-center rounded-xl border border-brand-gold/20 bg-brand-bg overflow-hidden">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                        className="px-2.5 py-2 hover:bg-brand-gold/10 transition-colors"
                        aria-label="Diminuer"
                      >
                        <Minus size={14} className="text-brand-text" />
                      </button>
                      <span className="px-4 text-sm font-semibold text-brand-text">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                        className="px-2.5 py-2 hover:bg-brand-gold/10 transition-colors"
                        aria-label="Augmenter"
                      >
                        <Plus size={14} className="text-brand-text" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase tracking-wider text-brand-text-muted">Sous-total</p>
                      <p className="font-bebas text-xl text-brand-gold">
                        {(item.product.price * item.quantity).toLocaleString()} FCFA
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {cartItems.length > 0 && (
        <div className="border-t border-brand-gold/10 bg-brand-bg-alt/80 px-6 py-5 space-y-4">
          <div className="rounded-2xl bg-brand-bg p-4 border border-brand-gold/10 space-y-2">
            <div className="flex items-center justify-between text-sm text-brand-text-muted">
              <span>Sous-total</span>
              <span>{cartTotal.toLocaleString()} FCFA</span>
            </div>
            <div className="flex items-center justify-between text-sm text-brand-text-muted">
              <span>Livraison</span>
              <span>Calculée à l’étape suivante</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-brand-gold/10">
              <span className="font-bebas text-lg uppercase tracking-wider text-brand-text">Total estimé</span>
              <span className="font-bebas text-2xl text-brand-gold">{cartTotal.toLocaleString()} FCFA</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onNext}
            className="w-full py-4 rounded-2xl bg-brand-gold text-[#0A0A0A] font-bebas text-xl uppercase tracking-widest hover:bg-brand-gold-light transition-all flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(184,149,42,0.18)]"
          >
            Continuer
            <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}