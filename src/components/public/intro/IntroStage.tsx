'use client';

// src/components/public/intro/IntroStage.tsx
// OV-1 (fondation) + OV-2 (champ organique) + OV-3 (convergence & transition).
//
// OV-3 — le scroll EST la timeline :
// - p = scrollProgress(scrollY) dans la course du sticky (scroll 100 % natif) ;
// - chaque vignette converge vers le centre avec son PROPRE délai (les
//   lointaines d'abord : l'orbite se ferme comme une main), en glissant le
//   long de son rayon d'origine vers un halo derrière le monogramme ;
// - dérive et parallaxe s'éteignent avec la progression (convergence propre) ;
// - le logo gagne en lumière (brightness 1 -> 1,6) et en présence ;
// - à p = 1 : vignettes en filigrane (opacity 0,08, échelle 0,55) DERRIÈRE
//   le logo -> « les looks composent le logo » ; le relâchement naturel du
//   sticky révèle ensuite le hero par un scroll continu (zéro saut) ;
// - OV-3e : AUCUN auto-advance — l'expérience n'avance que par le scroll
//   de l'utilisateur (USER INPUT -> SCROLL PROGRESS -> ANIMATION) ;
// - Échap / « Passer » (coin bas-droit, secondaire) : sortie directe ;
// - fin de séquence marquée EN MÉMOIRE du document (p >= 0,98 / skip /
//   scroll-past) : refresh et nouvel onglet REJOUENT l'intro (OV-3d),
//   la soft-navigation ne la rejoue pas.
//
// Performance : UNE boucle rAF (IO + visibilitychange), lectures de layout
// uniquement au resize (positions/typo précalculées), écritures
// transform/opacity/filter composées, aucun écouteur de scroll ajouté.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useCatalog } from '@/context/CatalogContext';
import {
  buildOrbitSeed,
  computePlacement,
  convergeTarget,
  convergenceDelay,
  driftOffset,
  easeInOutCubic,
  entranceProgress,
  getIntroRuntimeConfig,
  localProgress,
  logoState,
  breathScale,
  clamp01,
  parallaxFactor,
  pickOutfits,
  scrollProgress,
  sectionCourse,
  vignetteSizeStyle,
  WATERMARK_OPACITY,
  WATERMARK_SCALE,
  type OrbitSeed,
} from './introMotion';

const NON_VISUAL_SIBLING_TAGS = ['SCRIPT', 'NOSCRIPT', 'LINK', 'STYLE', 'TEMPLATE'];
const MAX_VIGNETTES = 8;
const MOBILE_VISIBLE = 5;
const SEEN_AT_PROGRESS = 0.98;

export function IntroStage() {
  const dismissed = useRef(false);
  const [hidden, setHidden] = useState(false);
  const { outfits } = useCatalog();

  const fieldRef = useRef<HTMLDivElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const cueRef = useRef<HTMLButtonElement | null>(null);
  const nodesRef = useRef<Array<HTMLDivElement | null>>([]);
  const seenMarked = useRef(false);

  // Orbites déterministes, indépendantes du viewport (rendu SSR stable).
  const picked = useMemo(() => pickOutfits(outfits ?? [], MAX_VIGNETTES), [outfits]);
  const seeds = useMemo<OrbitSeed[]>(
    () => picked.map((outfit, index) => buildOrbitSeed(outfit.id, index)),
    [picked]
  );
  const fieldKey = useMemo(() => picked.map((outfit) => outfit.id).join('|'), [picked]);

  const markSeen = useCallback(() => {
    if (seenMarked.current) return;
    seenMarked.current = true;
    // OV-3d — mémoire du DOCUMENT uniquement (aucun stockage persistant) :
    // l'intro est la première scène du site, rejouée à chaque chargement de
    // document (refresh, nouvel onglet) ; une soft-navigation vers la home
    // ne la rejoue pas (le re-check au montage lit ce drapeau).
    (window as unknown as { __PESCADOR_INTRO_DONE__?: number }).__PESCADOR_INTRO_DONE__ = 1;
  }, []);

  // Dismissal par l'utilisateur : collapse + saut au bloc suivant.
  const skip = useCallback(
    (instant = false) => {
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
        next?.scrollIntoView({
          behavior: instant || reduce ? 'auto' : 'smooth',
          block: 'start',
        });
      }
    },
    [markSeen]
  );

  // ── OV-1/OV-3 : gates / auto-advance / Échap / marquage session ─────
  useEffect(() => {
    // Gate pré-paint déjà active (script inline) -> la section est
    // display:none par CSS : aucun timer, aucun observateur, aucun rendu
    // supplémentaire. (Early-return simple : pas de setState synchrone
    // dans l'effet — règle react-hooks/set-state-in-effect.)
    if (document.documentElement.getAttribute('data-pescador-intro') === 'off') {
      return;
    }

    // Soft-navigation (p.ex. /looks -> /) : le gate pré-paint n'est évalué
    // qu'au chargement du document. Si la séquence a déjà été consommée dans
    // CE document, on masque la section sans animation — un refresh, lui,
    // rejoue l'intro (nouveau document, drapeau absent). Aucun setState :
    // mutation DOM directe post-mount.
    if ((window as unknown as { __PESCADOR_INTRO_DONE__?: number }).__PESCADOR_INTRO_DONE__ === 1) {
      document.getElementById('pescador-intro')?.style.setProperty('display', 'none');
      return;
    }

    // OV-3e — RÈGLE : l'expérience n'avance JAMAIS seule. Aucun timer, aucun
    // auto-scroll : seul le SCROLL de l'utilisateur pilote la convergence
    // (USER INPUT -> SCROLL PROGRESS -> ANIMATION). Le temps ne sert qu'aux
    // micro-animations internes (cascade d'entrée, dérive, respiration).
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') skip(true);
    };
    window.addEventListener('keydown', onKeyDown);

    // Sortie de la section (scroll-past) : séquence vue -> pas de répétition.
    const section = document.getElementById('pescador-intro');
    let observer: IntersectionObserver | null = null;
    if (section && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) markSeen();
      });
      observer.observe(section);
    }

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      observer?.disconnect();
    };
  }, [markSeen, skip]);

  // ── OV-2/OV-3 : champ organique + convergence, une boucle rAF ───────
  useEffect(() => {
    if (document.documentElement.getAttribute('data-pescador-intro') === 'off') return;
    const field = fieldRef.current;
    const section = document.getElementById('pescador-intro');
    if (!field || !section || seeds.length === 0 || dismissed.current) return;

    const cfg = getIntroRuntimeConfig(window.innerWidth);

    let raf = 0;
    let running = false;
    let inView = false;
    let width = field.clientWidth;
    let height = field.clientHeight;
    let sectionTop = section.offsetTop;
    let course = sectionCourse(section.offsetHeight, window.innerHeight);
    let sizes = nodesRef.current.map((node) =>
      node ? { w: node.offsetWidth, h: node.offsetHeight } : { w: 0, h: 0 }
    );

    const parallax = { tx: 0, ty: 0, x: 0, y: 0 };
    let lastCueFade = 1;

    // STATIC (reduced-motion) : positions finales posées UNE fois — aucune
    // boucle rAF, aucune dérive, aucun parallaxe, aucun auto-advance. La
    // signature reste visible ; le mouvement est simplement absent.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (let i = 0; i < seeds.length; i += 1) {
        const node = nodesRef.current[i];
        const seed = seeds[i];
        if (!node) continue;
        const place = computePlacement(seed, width, height);
        node.style.transform = `translate3d(${(place.x - (sizes[i]?.w ?? 0) / 2).toFixed(1)}px, ${(place.y - (sizes[i]?.h ?? 0) / 2).toFixed(1)}px, 0)`;
        node.style.opacity = '1';
      }
      if (logoRef.current) logoRef.current.style.opacity = '1';
      return;
    }

    const refreshBox = () => {
      width = field.clientWidth;
      height = field.clientHeight;
      sectionTop = section.offsetTop;
      course = sectionCourse(section.offsetHeight, window.innerHeight);
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
      const p = scrollProgress(window.scrollY, sectionTop, course);
      if (p >= SEEN_AT_PROGRESS) markSeen();

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

        // Convergence : sous-progression locale, décalée par la distance
        // initiale (les lointaines ferment l'orbite en premier).
        const local = easeInOutCubic(localProgress(p, convergenceDelay(seed)));

        const place = computePlacement(seed, width, height);
        const target = convergeTarget(seed, width, height);
        const drift = driftOffset(seed, t, cfg.driftFactor * (1 - local));
        const pointer = parallaxFactor(seed.depth) * cfg.parallaxPx * (1 - p);

        const x =
          place.x + (target.x - place.x) * local + drift.x + parallax.x * pointer - (sizes[i]?.w ?? 0) / 2;
        const y =
          place.y + (target.y - place.y) * local + drift.y + parallax.y * pointer - (sizes[i]?.h ?? 0) / 2;
        const scale = breathScale(seed, t) * (0.92 + 0.08 * entrance) * (1 + (WATERMARK_SCALE - 1) * local);
        const opacity = entrance * (1 + (WATERMARK_OPACITY - 1) * local);

        node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`;
        node.style.opacity = opacity.toFixed(3);
      }

      // Logo : or lumineux progressif (opacity / brightness / scale).
      const logo = logoRef.current;
      if (logo) {
        const state = logoState(p);
        logo.style.opacity = state.opacity.toFixed(3);
        logo.style.filter = `brightness(${state.brightness.toFixed(3)})`;
        logo.style.transform = `scale(${state.scale.toFixed(4)})`;
      }

      // Indicateur/skip : s'efface dès les premiers pixels de scroll — sa
      // raison d'être (« l'expérience continue vers le bas ») s'éteint
      // d'elle-même une fois l'utilisateur en mouvement. Écriture seulement
      // au changement (zéro churn de style par frame au repos).
      const cue = cueRef.current;
      if (cue) {
        const cueFade = 1 - clamp01(p * 5);
        if (cueFade !== lastCueFade) {
          lastCueFade = cueFade;
          cue.style.opacity = cueFade.toFixed(3);
          cue.style.visibility = cueFade <= 0.05 ? 'hidden' : 'visible';
        }
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
    if (typeof IntersectionObserver !== 'undefined') {
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
  }, [fieldKey, seeds, markSeen]);

  if (hidden) return null;

  return (
    <div className="relative flex h-screen w-full flex-col items-center justify-center">
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
              className={`absolute left-1/2 top-1/2 overflow-hidden rounded-xl ring-1 ring-white/10 will-change-transform ${
                index >= MOBILE_VISIBLE ? 'hidden lg:block' : ''
              } ${seed.depth === 0 ? 'lg:blur-[2px]' : ''}`}
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
            ref={logoRef}
            data-intro-logo
            src="/assets/brand/hp-logo.webp"
            alt=""
            width={640}
            height={642}
            fetchPriority="high"
            loading="lazy"
            decoding="async"
            className="h-auto w-[min(62vw,300px)] will-change-transform"
            style={{ opacity: 0.85 }}
          />
          <p className="font-bebas text-sm tracking-[0.42em] text-brand-gold/80 uppercase sm:text-base">
            HP Collection
          </p>
        </div>

      </div>

      {/* OV-3e — Skip secondaire : le SCROLL est l'interaction principale,
          ce contrôle est un accès rapide discrètement logé en bas à GAUCHE,
          ANCRÉ AU VIEWPORT (la nav in-flow décale la section de ~90 px : un
          ancrage absolu au conteneur plaçait le cue SOUS la ligne de
          flottaison à l'arrivée) ; bas-droit réservé au WhatsApp flottant
          PERF-05 (collision d'interception évitée).
          Chevron « ça continue en bas » + « Passer », opacité de repos
          0.35, or au survol, cible ≥ 44 px, focus visible (seul élément
          focusable). S'efface dès le premier scroll (boucle rAF). */}
      <button
        ref={cueRef}
        type="button"
        onClick={() => skip()}
        aria-label="Passer l'introduction"
        className="fixed bottom-4 left-4 z-30 flex cursor-pointer flex-col items-center gap-1.5 px-4 py-3 text-[9px] font-medium tracking-[0.32em] text-white/35 uppercase transition-colors duration-300 hover:text-brand-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-gold"
      >
        <svg className="intro-cue-chevron h-4 w-4" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3 6l5 5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Passer</span>
      </button>
    </div>
  );
}
