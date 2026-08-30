'use client';

// IMP-09 — Modal « Look » premium : inspection d'un outfit du carousel home.
// Composant autonome zéro dépendance : pièces cliquables vers les fiches
// produit, ajout au panier en un clic avec confirmation visuelle, relais
// WhatsApp (même message que la page /looks). Accessible : role dialog +
// aria-modal, Escape, focus initial sur la fermeture, piège de focus (Tab),
// focus restitué et scroll body restauré au démontage. Animations 100%
// tokens IMP-01, neutralisées par prefers-reduced-motion (règle globale).

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, Sparkles, Check, MessageCircle } from 'lucide-react';
import type { Outfit } from '@/types';
import { buildWhatsAppUrl } from '@/services/whatsappService';

const ADDED_FEEDBACK_MS = 900;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

interface LookModalProps {
  outfit: Outfit;
  whatsappPhone: string;
  onClose: () => void;
  onAdd: (outfit: Outfit) => void;
}

export function LookModal({ outfit, whatsappPhone, onClose, onAdd }: LookModalProps) {
  const [added, setAdded] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // IMP-09 — Cycle a11y : focus initial + piège Tab + Escape + scroll-lock,
  // tout restauré au démontage (focus rendu à la carte d'origine du carousel).
  useEffect(() => {
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key === 'Tab' && panelRef.current) {
        const focusables = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        ).filter((element) => element.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && (document.activeElement === first || document.activeElement === document.body)) {
          event.preventDefault();
          last.focus();
        }
      }
    };

    window.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [onClose]);

  // Confirmation d'ajout : bref état « ✓ ajouté » puis fermeture automatique.
  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(onClose, ADDED_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [added, onClose]);

  const handleAdd = () => {
    onAdd(outfit);
    setAdded(true);
  };

  const handleWhatsApp = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://perscadors.vercel.app';
    const message = `Bonjour 👋\n\nJe souhaite recréer ce look : ${outfit.name}\n\n${origin}${outfit.image}\n\nMerci !`;
    window.open(buildWhatsAppUrl(message, whatsappPhone), '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="lightbox-fade-in absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Inspecter le look ${outfit.name}`}
        className="look-modal-in relative w-full max-w-3xl bg-brand-bg text-brand-text rounded-2xl overflow-hidden border border-brand-gold/30 shadow-2xl flex flex-col md:flex-row z-10 max-h-[90vh] overflow-y-auto md:overflow-visible"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Fermer la fenêtre de l'outfit"
          className="absolute top-4 right-4 z-20 p-2 bg-[#0A0A0A]/60 hover:bg-brand-gold hover:text-brand-bg text-white rounded-full transition-colors duration-(--motion-micro) ease-out-expo cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="relative w-full md:w-1/2 h-80 md:h-[500px] flex-shrink-0">
          <Image
            src={outfit.image}
            alt={outfit.name}
            fill
            sizes="(max-width: 768px) 100vw, 384px"
            className="object-cover"
          />
          <div className="absolute top-4 left-4 bg-brand-gold text-brand-bg font-bebas text-sm uppercase px-3 py-1 rounded tracking-wider shadow">
            Vioutou Outfit 🔥
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0A0A0A]/90 to-transparent p-6 text-white md:hidden">
            <h3 className="font-bebas text-3xl tracking-wider text-brand-gold">{outfit.name}</h3>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <span className="hidden md:inline-block font-bebas text-sm tracking-widest text-brand-gold uppercase bg-brand-gold/10 px-3 py-1 rounded mb-3">
              Outfit Collection 🔥
            </span>
            <h3 className="hidden md:block font-bebas text-4xl tracking-wider leading-tight text-brand-text">
              {outfit.name}
            </h3>
            <p className="text-sm text-brand-text-muted mt-2">
              Cet outfit est composé de pièces streetwear HP Collection exclusives sélectionnées par Vioutou — clique sur une pièce pour la découvrir :
            </p>

            <div className="mt-6 space-y-4 max-h-48 md:max-h-none overflow-y-auto pr-1">
              {outfit.products.map((product) => (
                <Link
                  key={product.id}
                  href={`/produit/${product.id}`}
                  onClick={onClose}
                  className="flex items-center justify-between p-3 bg-brand-bg-alt rounded-lg border border-brand-gold/5 hover:border-brand-gold/40 transition-colors duration-(--motion-micro) ease-out-expo group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-14 overflow-hidden rounded bg-brand-bg flex-shrink-0">
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h4 className="font-bebas text-lg leading-tight group-hover:text-brand-gold transition-colors duration-(--motion-micro) ease-out-expo">
                        {product.name}
                      </h4>
                      <span className="text-xs text-brand-text-muted uppercase tracking-wider block">
                        {product.category.replace(/-/g, ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="font-bold text-sm text-brand-gold">
                    {product.price.toLocaleString()} FCFA
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-brand-gold/10">
            <div className="flex justify-between items-center text-lg">
              <span className="font-bebas text-brand-text-muted">Total du Look</span>
              <span className="text-2xl font-bold text-brand-gold">
                {outfit.price.toLocaleString()} FCFA
              </span>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              disabled={added}
              className={`w-full py-4 font-bebas text-xl uppercase tracking-widest rounded transition-all duration-(--motion-micro) ease-out-expo shadow-lg flex items-center justify-center gap-2 cursor-pointer ${
                added
                  ? 'bg-green-600 text-white cursor-default'
                  : 'bg-brand-gold hover:bg-brand-gold-light text-[#0A0A0A]'
              }`}
            >
              {added ? (
                <>
                  <Check size={20} />
                  Look ajouté au panier
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Recréer ce look
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleWhatsApp}
              className="w-full py-3 border border-brand-gold/40 text-brand-gold hover:bg-brand-gold/10 font-bebas text-lg uppercase tracking-widest rounded transition-colors duration-(--motion-micro) ease-out-expo flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle size={18} />
              Demander sur WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
