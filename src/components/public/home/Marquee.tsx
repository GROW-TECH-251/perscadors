// IMP-06 — Marquee éditorial (bande de marque défilante).
// Composant SERVEUR (zéro JS client) : l'animation est du CSS transform pur.
// Deux groupes identiques (le second aria-hidden) → translation de -50% de
// la piste = boucle infinie sans saut. Le conteneur overflow-hidden garantit
// l'absence de débordement horizontal (garde E2E responsive). Pause au
// survol/focus ; prefers-reduced-motion neutralise l'animation (règle globale).

import React from 'react';

const MARQUEE_ITEMS = [
  'HP Collection',
  'Cotonou',
  'Streetwear Premium',
  'Sélection Vioutou',
  'Livraison Express',
  'Qualité Signature',
];

function MarqueeGroup({ hidden }: { hidden: boolean }) {
  return (
    <div aria-hidden={hidden} className="flex items-center">
      {MARQUEE_ITEMS.map((item) => (
        <span key={item} className="flex items-center">
          <span className="font-bebas text-lg sm:text-xl tracking-[3px] uppercase text-brand-gold whitespace-nowrap">
            {item}
          </span>
          <span
            aria-hidden="true"
            className="mx-6 sm:mx-8 h-1.5 w-1.5 rotate-45 bg-brand-gold/50 flex-shrink-0"
          />
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="marquee overflow-hidden bg-[#0A0A0A] border-y border-brand-gold/20 py-3 sm:py-3.5 select-none">
      <div className="marquee-track">
        <MarqueeGroup hidden={false} />
        <MarqueeGroup hidden />
      </div>
    </div>
  );
}
