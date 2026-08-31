'use client';

// src/components/public/intro/IntroStage.tsx
// OV-1 (fondation) + OV-2 (champ organique).
//
// OV-1 : logo HP statique + « Passer l'introduction » + auto-dismiss 2,5 s
// (scroll seul, sans mutation DOM -> CLS 0), marquage session au scroll-past,
// gates pré-paint (session / reduced-motion / Save-Data / ?intro=0).
//
// OV-2 : champ de vignettes HP LOOK autour du logo —
// - source : useCatalog() (catalogue DÉJÀ hydraté par le serveur, PERF-02 :
//   zéro requête REST au chargement, aucune nouvelle source de vérité) ;
// - orbites déterministes seedées par id (introMotion.ts) : angle doré +
//   jitter (jamais un cercle), échelles/profondeurs individuelles ;
// - UNE seule boucle rAF (démarrée/arrêtée par IntersectionObserver et
//   visibilitychange), écritures transform + opacity uniquement (composées) ;
// - dérive Lissajous (mobile : amplitudes ×0.6), parallaxe pointeur
//   desktop (lerp 0.08), flou des vignettes lointaines desktop only ;
// - images : next/image AVIF, 3 eager / reste lazy ; mobile n'affiche (et
//   ne charge) que 5 vignettes via CSS — zéro branchement JS de viewport.
//
// Accessibilité : champ aria-hidden décoratif, un seul focusable (« Passer »).

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useCatalog } from '@/context/CatalogContext';
import {
  buildOrbitSeed,
  computePlacement,
  driftOffset,
  entranceProgress,
  getIntroRuntimeConfig,
  parallaxFactor,
  pickOutfits,
  vignetteSizeStyle,
  type OrbitSeed,
} from './introMotion';

const AUTO_DISMISS_MS = 2_500;
const SEEN_KEY = 'pescador-intro-seen';
const NON_VISUAL_SIBLING_TAGS = ['SCRIPT', 'NOSCRIPT', 'LINK', 'STYLE', 'TEMPLATE'];
const MAX_VIGNETTES = 8;
const MOBILE_VISIBLE = 5;

export function IntroStage() {
  const dismissed = useRef(false);
  const [hidden, setHidden] = useState(false);
  const { outfits } = useCatalog();

  const fieldRef = useRef<HTMLDivElement | null>(null);
  const nodesRef = useRef<Array<HTMLDivElement | null>>([]);

  // Orbites déterministes, indépendantes du viewport (rendu SSR stable).
  const picked = useMemo(() => pickOutfits(outfits ?? [], MAX_VIGNETTES), [outfits]);
  const seeds = useMemo<OrbitSeed[]>(
    () => picked.map((outfit, index) => buildOrbitSeed(outfit.id, index)),
    [picked]
  );
  const fieldKey = useMemo(() => picked.map((outfit) => outfit.id).join('|'), [picked]);

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
      // Le sibling immédiat peut être un <script> JSON-LD (sans boîte) :
      // on avance jusqu'au premier élément visuel (le hero).
      let next = section.nextElementSibling;
      while (next && NON_VISUAL_SIBLING_TAGS.includes(next.tagName)) {
        next = next.nextElementSibling;
      }
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      section.style.display = 'none';
      setHidden(true);
      next?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  }, [markSeen]);

  // ── OV-1 : gates / auto-dismiss / marquage session ──────────────────
  useEffect(() => {
    // Gate pré-paint déjà active (script inline) -> la section est
    // display:none par CSS : aucun timer, aucun observateur, aucun rendu
    // supplémentaire. (Early-return simple : pas de setState synchrone
    // dans l'effet — règle react-hooks/set-state-in-effect.)
    if (document.documentElement.getAttribute('data-pescador-intro') === 'off') {
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

  // ── OV-2 : champ organique — une boucle rAF, composée et bornée ─────
  useEffect(() => {
    if (document.documentElement.getAttribute('data-pescador-intro') === 'off') return;
    const field = fieldRef.current;
    if (!field || seeds.length === 0 || dismissed.current) return;

    const cfg = getIntroRuntimeConfig(window.innerWidth);
    const section = document.getElementById('pescador-intro');

    let raf = 0;
    let running = false;
    let inView = false;
    let width = field.clientWidth;
    let height = field.clientHeight;
    let sizes = nodesRef.current.map((node) =>
      node ? { w: node.offsetWidth, h: node.offsetHeight } : { w: 0, h: 0 }
    );

    const parallax = { tx: 0, ty: 0, x: 0, y: 0 };

    const refreshBox = () => {
      width = field.clientWidth;
      height = field.clientHeight;
      sizes = nodesRef.current.map((node) =>
        node ? { w: node.offsetWidth, h: node.offsetHeight } : { w: 0, h: 0 }
      );
    };
    const onPointer = (event: PointerEvent) => {
      parallax.tx = (event.clientX / window.innerWidth - 0.5) * 2;
      parallax.ty = (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const frame = () => {
      const t = performance.now();
      parallax.x += (parallax.tx - parallax.x) * 0.08;
      parallax.y += (parallax.ty - parallax.y) * 0.08;

      for (let i = 0; i < seeds.length; i += 1) {
        const node = nodesRef.current[i];
        const seed = seeds[i];
        if (!node) continue;

        const entrance = entranceProgress(seed, t);
        if (entrance === 0) {
          node.style.opacity = '0';
          continue;
        }

        const place = computePlacement(seed, width, height);
        const drift = driftOffset(seed, t, cfg.driftFactor);
        const pointer = parallaxFactor(seed.depth) * cfg.parallaxPx;
        const x = place.x + drift.x + parallax.x * pointer - (sizes[i]?.w ?? 0) / 2;
        const y = place.y + drift.y + parallax.y * pointer - (sizes[i]?.h ?? 0) / 2;

        node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${(0.92 + 0.08 * entrance).toFixed(3)})`;
        node.style.opacity = entrance.toFixed(3);
      }

      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (!running) {
        running = true;
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      if (running) {
        running = false;
        cancelAnimationFrame(raf);
      }
    };

    // La boucle ne tourne que lorsque la section est à l'écran.
    let fieldObserver: IntersectionObserver | null = null;
    if (section && typeof IntersectionObserver !== 'undefined') {
      fieldObserver = new IntersectionObserver((entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        if (inView && !document.hidden) start();
        else stop();
      });
      fieldObserver.observe(section);
    } else {
      inView = true;
      start();
    }

    const onVisibility = () => {
      if (document.hidden) stop();
      else if (inView) start();
    };

    const fineDesktop = window.matchMedia('(min-width: 1024px) and (pointer: fine)');
    if (cfg.parallaxPx > 0 && fineDesktop.matches) {
      window.addEventListener('pointermove', onPointer, { passive: true });
    }
    window.addEventListener('resize', refreshBox, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      fieldObserver?.disconnect();
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('resize', refreshBox);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [fieldKey, seeds]);

  if (hidden) return null;

  return (
    <div className="relative flex w-full flex-col items-center">
      {/* Champ organique — décoratif, derrière le logo */}
      <div
        ref={fieldRef}
        data-intro-field
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      >
        {picked.map((outfit, index) => {
          const seed = seeds[index];
          const size = vignetteSizeStyle(seed);
          return (
            <div
              key={outfit.id}
              data-vignette
              ref={(node) => {
                nodesRef.current[index] = node;
              }}
              className={`absolute left-0 top-0 overflow-hidden rounded-xl ring-1 ring-white/10 will-change-transform ${
                index >= MOBILE_VISIBLE ? 'hidden lg:block' : ''
              } ${seed.depth === 0 ? 'lg:blur-[1.5px]' : ''}`}
              style={{ ...size, opacity: 0, zIndex: 10 + seed.depth }}
            >
              <Image
                src={outfit.image}
                alt=""
                fill
                sizes="(max-width: 767px) 32vw, 20vw"
                loading={index < 3 ? 'eager' : 'lazy'}
                className="object-cover"
              />
            </div>
          );
        })}
      </div>

      <div className="relative z-20 flex flex-col items-center gap-7 px-6 text-center">
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
    </div>
  );
}
