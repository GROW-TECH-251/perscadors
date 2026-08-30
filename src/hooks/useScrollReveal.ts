'use client';

import { useEffect, useRef } from 'react';

/**
 * IMP-05 — Scroll reveal system.
 *
 * Révélation douce (opacity + translation) à l'entrée dans le viewport.
 * Garde-fous par design :
 * - SEO : l'état caché (`reveal-hidden`) n'est posé QUE par ce JS après
 *   hydration. Le HTML serveur contient tout le contenu, visible. Crawlers
 *   et navigateurs sans JS voient la page intégrale.
 * - Accessibilité : `prefers-reduced-motion: reduce` → le hook ne cache
 *   rien et ne crée aucun observateur (rien à animer, rien de masqué).
 * - Compatibilité : sans `IntersectionObserver`, dégradation totale
 *   (contenu visible), aucune erreur.
 * - Performance : un seul observateur par élément, déconnecté dès la
 *   première révélation ; CSS limité à transform/opacity.
 */
export function useScrollReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Reduced motion = la loi (acquis Phase 1) : aucun masquage.
    if (typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Navigateurs/crawlers sans IntersectionObserver : tout reste visible.
    if (typeof IntersectionObserver === 'undefined') {
      return;
    }

    element.classList.add('reveal-hidden');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            element.classList.add('reveal-visible');
            observer.disconnect();
          }
        });
      },
      // Révélation quand la section entre à ~10% du bas du viewport.
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      element.classList.remove('reveal-hidden', 'reveal-visible');
    };
  }, []);

  return ref;
}
