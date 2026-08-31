'use client';

// src/components/public/intro/IntroStage.tsx
// OV-1 — Stage STATIQUE (aucune animation à ce stade).
//
// Rendu : logo HP Collection (fourni par la marque, or/bronze sur noir,
// servi en WebP 640px ~49 Ko) + wordmark + bouton « Passer l'introduction ».
//
// Comportements OV-1 :
// - Auto-dismiss 2,5 s sans interaction : SCROLL SEUL (aucune mutation du
//   DOM -> aucun layout shift -> CLS 0). Annulé au premier geste
//   (wheel/touch/keydown/pointer) : l'utilisateur reste maître.
// - navigator.webdriver (E2E, lighthouse-lab interne) -> pas d'auto-dismiss
//   (tests déterministes).
// - « Passer » (clic) : collapse de la section + scrollIntoView du bloc
//   suivant (le hero) — shift causé par un input utilisateur -> exclu du CLS.
// - Sortie naturelle de la section (scroll-past) : marquage session
//   (IntersectionObserver) -> pas d'intro au rechargement de la session.
// - Gate pré-paint active (data-pescador-intro="off") : démontage.
//
// Image : width/height fixés (0 CLS), loading="lazy" + fetchPriority="high"
// -> chargée immédiatement en 1re visite (in-viewport), JAMAIS téléchargée
// quand la section est masquée (lazy + display:none = pas de fetch).

import React, { useCallback, useEffect, useRef, useState } from 'react';

const AUTO_DISMISS_MS = 2_500;
const SEEN_KEY = 'pescador-intro-seen';

export function IntroStage() {
  const dismissed = useRef(false);
  const [hidden, setHidden] = useState(false);

  const markSeen = useCallback(() => {
    try {
      window.sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* sessionStorage indisponible : l'intro ressortira, sans gravité */
    }
  }, []);

  // Dismissal par l'utilisateur (bouton) : collapse + saut au bloc suivant.
  const skip = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    markSeen();
    const section = document.getElementById('pescador-intro');
    if (section) {
      const next = section.nextElementSibling;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      section.style.display = 'none';
      setHidden(true);
      next?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }, [markSeen]);

  useEffect(() => {
    // Gate pré-paint déjà active (script inline) -> rien à monter.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- démontage immédiat du stage quand la gate pré-paint a déjà masqué la section (évite tout travail post-hydratation)
    if (document.documentElement.getAttribute('data-pescador-intro') === 'off') {
      setHidden(true);
      return;
    }

    let timer = 0;
    const cancelAuto = () => {
      if (timer) {
        window.clearTimeout(timer);
        timer = 0;
      }
    };

    // Auto-dismiss : scroll seul, SANS mutation du DOM (CLS 0). Jamais en
    // contexte automatisé (webdriver) pour garder des E2E déterministes.
    if (!navigator.webdriver) {
      timer = window.setTimeout(() => {
        if (dismissed.current) return;
        const section = document.getElementById('pescador-intro');
        const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (section) {
          window.scrollTo({
            top: section.offsetTop + section.offsetHeight,
            behavior: reduce ? 'auto' : 'smooth',
          });
        }
      }, AUTO_DISMISS_MS);
    }

    const cancelEvents = ['wheel', 'touchmove', 'keydown', 'pointerdown'] as const;
    cancelEvents.forEach((event) => window.addEventListener(event, cancelAuto, { passive: true }));

    // Sortie de la section (scroll-past, y compris l'auto-scroll) :
    // la séquence a été vue -> pas de répétition dans la session.
    const section = document.getElementById('pescador-intro');
    let observer: IntersectionObserver | null = null;
    if (section && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          markSeen();
          cancelAuto();
        }
      });
      observer.observe(section);
    }

    return () => {
      cancelAuto();
      cancelEvents.forEach((event) => window.removeEventListener(event, cancelAuto));
      observer?.disconnect();
    };
  }, [markSeen]);

  if (hidden) return null;

  return (
    <div className="flex flex-col items-center gap-7 px-6 text-center">
      <div aria-hidden="true" className="flex flex-col items-center gap-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- média de marque à résolution fixe, hors optimiseur (fond noir natif du fichier) */}
        <img
          src="/assets/brand/hp-logo.webp"
          alt=""
          width={640}
          height={642}
          fetchPriority="high"
          loading="lazy"
          decoding="async"
          className="h-auto w-[min(62vw,300px)]"
        />
        <p className="font-bebas text-sm tracking-[0.42em] text-brand-gold/80 uppercase sm:text-base">
          HP Collection
        </p>
      </div>

      <button
        type="button"
        onClick={skip}
        className="cursor-pointer rounded-full border border-white/25 px-6 py-2.5 text-xs font-medium tracking-[0.18em] text-white/70 uppercase transition-colors duration-200 hover:border-brand-gold/60 hover:text-brand-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold"
      >
        Passer l&apos;introduction
      </button>
    </div>
  );
}
