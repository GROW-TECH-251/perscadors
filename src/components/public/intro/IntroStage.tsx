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
  FADE_OUT_MS,
  parallaxFactor,
  pickOutfits,
  rotationCounter,
  scrollProgress,
  sectionCourse,
  slotFade,
  vignetteSizeStyle,
  WATERMARK_OPACITY,
  WATERMARK_SCALE,
  type OrbitSeed,
} from './introMotion';

const NON_VISUAL_SIBLING_TAGS = ['SCRIPT', 'NOSCRIPT', 'LINK', 'STYLE', 'TEMPLATE'];
const MAX_VIGNETTES = 9;
const MOBILE_VISIBLE = 6;
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

  // ── OV-3f — SLOTS tournants : le champ montre MAX_VIGNETTES slots ; à
  // l'arrêt (avant scroll), un slot « rend » son look et en accueille un
  // autre de la GALERIE COMPLÈTE (fondu 550/700 ms), round-robin — tout le
  // catalogue HP LOOKS vit autour du logo, sans monotonic. Les orbites
  // restent déterministes par (id, slot) : un look revient toujours à la
  // même place. Statique sous reduced-motion (aucune rotation).
  const [slots, setSlots] = useState<Array<{ id: string; phase: 'in' | 'idle' | 'out'; since: number; nextId: string | null }>>([]);
  const picked = useMemo(() => pickOutfits(outfits ?? [], MAX_VIGNETTES), [outfits]);
  const outfitById = useMemo(() => new Map((outfits ?? []).map((o) => [o.id, o])), [outfits]);
  const seeds = useMemo<OrbitSeed[]>(
    () => slots.map((slot, index) => buildOrbitSeed(slot.id, index)),
    [slots]
  );
  // Refs miroirs : la boucle rAF lit l'état SANS se réexécuter à chaque
  // remplacement (aucun teardown/redémarrage de boucle lors des swaps).
  // OV-3f-fix2 — les miroirs sont synchronisés dans un EFFET après chaque
  // render, JAMAIS pendant le render (règle React « Cannot access refs
  // during render » — erreurs signalées par l'éditeur aux anciennes lignes
  // 88/90/92). La valeur initiale du useRef couvre la première frame.
  const seedsRef = useRef(seeds);
  const slotsRef = useRef(slots);
  const outfitsRef = useRef(outfits ?? []);
  useEffect(() => {
    seedsRef.current = seeds;
    slotsRef.current = slots;
    outfitsRef.current = outfits ?? [];
  });
  const poolRef = useRef(0); // pointeur round-robin dans la galerie

  const markSeen = useCallback(() => {
    if (seenMarked.current) return;
    seenMarked.current = true;
    // OV-3d — mémoire du DOCUMENT uniquement (aucun stockage persistant) :
    // l'intro est la première scène du site, rejouée à chaque chargement de
    // document (refresh, nouvel onglet) ; une soft-navigation vers la home
    // ne la rejoue pas (le re-check au montage lit ce drapeau).
        (window as unknown as { __PESCADOR_INTRO_DONE__?: number }).__PESCADOR_INTRO_DONE__ = 1;
    // DERNIÈRE IMPLÉMENTATION — libère le mode narratif CSS (navbar/
    // WhatsApp) : la séquence est consommée ; le runtime Navbar
    // décide désormais seul (position réelle du hero).
    document.getElementById('pescador-intro')?.setAttribute('data-intro-done', '1');
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

  // Initialisation des slots dès que le catalogue est hydraté (une fois).
  const seededRef = useRef(false);
  useEffect(() => {
    if (seededRef.current || picked.length === 0) return;
    seededRef.current = true;
    setSlots(picked.map((outfit) => ({ id: outfit.id, phase: 'idle' as const, since: 0, nextId: null })));
  }, [picked]);

  // ── OV-1/OV-3 : gates / auto-advance / Échap / marquage session ─────
  useEffect(() => {
    // Gate pré-paint déjà active (script inline) -> la section est
    // display:none par CSS : aucun timer, aucun observateur, aucun rendu
    // supplémentaire. (Early-return simple : pas de setState synchrone
    // dans l'effet — règle react-hooks/set-state-in-effect.)
    if (document.documentElement.getAttribute('data-pescador-intro') === 'off') {
      // Pas de séquence : on libère immédiatement le mode narratif CSS
      // (le runtime Navbar masquera lui-même la navbar pendant le hero,
      // première scène de cette visite).
      document.getElementById('pescador-intro')?.setAttribute('data-intro-done', '1');
      return;
    }

    // Soft-navigation (p.ex. /looks -> /) : le gate pré-paint n'est évalué
    // qu'au chargement du document. Si la séquence a déjà été consommée dans
    // CE document, on masque la section sans animation — un refresh, lui,
    // rejoue l'intro (nouveau document, drapeau absent). Aucun setState :
    // mutation DOM directe post-mount.
    if ((window as unknown as { __PESCADOR_INTRO_DONE__?: number }).__PESCADOR_INTRO_DONE__ === 1) {
      document.getElementById('pescador-intro')?.style.setProperty('display', 'none');
      document.getElementById('pescador-intro')?.setAttribute('data-intro-done', '1');
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
    if (!field || !section || seedsRef.current.length === 0 || dismissed.current) return;

    const cfg = getIntroRuntimeConfig(window.innerWidth);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const effectStart = performance.now();
    const slotCount = seedsRef.current.length;
    let lastSwapCounter = 0;

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
    if (reduce) {
      // STATIQUE : pas de rotation non plus — le champ reste figé.
      for (let i = 0; i < seedsRef.current.length; i += 1) {
        const node = nodesRef.current[i];
        const seed = seedsRef.current[i];
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

      // OV-3f — Rotation de galerie (micro-animation INTERNE, à l'arrêt
      // uniquement) : un slot par intervalle, round-robin. Jamais pendant
      // la convergence (p < 0,1), jamais sous reduced-motion, jamais après
      // sortie — et la boucle s'arrête hors écran/onglet caché, donc la
      // rotation se met en pause avec elle.
      if (!reduce && p < 0.1 && !dismissed.current) {
        const counter = rotationCounter(t - effectStart);
        if (counter > lastSwapCounter) {
          lastSwapCounter = counter;
          const index = counter % slotCount;
          setSlots((prev) => {
            const slot = prev[index];
            if (!slot || slot.phase !== 'idle' || prev.length !== slotCount) return prev;
            const gallery = outfitsRef.current;
            if (gallery.length <= slotCount) return prev; // galerie entière déjà affichée
            const busy = new Set<string>();
            prev.forEach((sl) => {
              busy.add(sl.id);
              if (sl.nextId) busy.add(sl.nextId);
            });
            let candidate: { id: string } | null = null;
            for (let k = 0; k < gallery.length; k += 1) {
              const outfit = gallery[(poolRef.current + k) % gallery.length];
              if (!busy.has(outfit.id)) {
                candidate = outfit;
                poolRef.current = (poolRef.current + k + 1) % gallery.length;
                break;
              }
            }
            if (!candidate) return prev;
            const copy = [...prev];
            copy[index] = { ...slot, phase: 'out', since: performance.now(), nextId: candidate.id };
            return copy;
          });
        }
      }

      parallax.x += (parallax.tx - parallax.x) * 0.08;
      parallax.y += (parallax.ty - parallax.y) * 0.08;

      // OV-3f-fix — seeds lus À CHAQUE FRAME via la ref : la closure de
      // l'effet daterait du montage (deps = [markSeen, slots.length]) et
      // les looks accueillis en rotation hériteraient des caractéristiques
      // (rayon/échelle/dérive/respiration) des anciens.
      const liveSeeds = seedsRef.current;
      for (let i = 0; i < liveSeeds.length; i += 1) {
        const node = nodesRef.current[i];
        const seed = liveSeeds[i];
        if (!node) continue;

        const entrance = entranceProgress(seed, t);
        if (entrance === 0) {
          node.style.opacity = '0';
          continue;
        }

        // Fondu de rotation : sortie -> remplacement -> entrée (commit
        // exactement quand la sortie est terminée : zéro chevauchement).
        const slot = slotsRef.current[i];
        let fade = 1;
        if (slot && slot.phase !== 'idle') {
          fade = slotFade(slot.phase, slot.since, t);
          if (slot.phase === 'out' && slot.nextId && t - slot.since >= FADE_OUT_MS) {
            const nextId = slot.nextId;
            setSlots((prev) => {
              const copy = [...prev];
              copy[i] = { id: nextId, phase: 'in', since: performance.now(), nextId: null };
              return copy;
            });
          }
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
        const opacity = entrance * fade * (1 + (WATERMARK_OPACITY - 1) * local);

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
    // Dépendances MINIMALES : la boucle lit slots/seeds via refs — les
    // remplacements de la rotation ne la relancent pas. slotCount ne
    // change qu'une fois (0 -> 9 à l'hydratation du catalogue).
  }, [markSeen, slots.length]);

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
        {slots.map((slot, index) => {
          const outfit = outfitById.get(slot.id);
          if (!outfit) return null;
          const seed = seeds[index];
          const size = vignetteSizeStyle(seed);
          return (
            <div
              key={slot.id}
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
                sizes="(max-width: 767px) 30vw, 18vw"
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
            loading="eager"
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
