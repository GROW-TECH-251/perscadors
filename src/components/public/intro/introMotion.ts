// src/components/public/intro/introMotion.ts
// OV-2 — Maths PURES du champ organique (aucune dépendance React/DOM :
// entièrement testables unitairement, exécutables côté serveur).
//
// Principes anti « carrousel mécanique » :
// - angle doré (137,508°) entre voisins + jitter individuel ±28° :
//   jamais un cercle parfait, jamais une rotation continue ;
// - rayons / échelles / profondeurs / dérives individuels (seed par id) ;
// - dérive = 2 sinusoïdes INCOMMENSURABLES (Lissajous) : la scène vit
//   sans boucle perceptible ;
// - cascade d'entrée décalée : l'univers se CONSTRUIT progressivement.
//
// Déterminisme total : same id -> same orbite (re-rendu stable, SSR sûr).

export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 2,39996 rad = 137,508°
export const RADIUS_RATIO_MIN = 0.3;
export const RADIUS_RATIO_MAX = 0.48;
export const SCALE_MIN = 0.85;
export const SCALE_MAX = 1.15;
export const ANGLE_JITTER_MAX = (28 * Math.PI) / 180;
export const ENTRANCE_DURATION_MS = 700;
export const OUTFIT_IMAGE_RATIO = 1086 / 828; // portrait source des visuels looks

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// -------------------------------------------
// Config par contexte (résolue avec window, jamais pendant le rendu)
// -------------------------------------------
export interface IntroRuntimeConfig {
  /** vignettes simultanément visibles (le DOM peut en porter plus, CSS masque) */
  visibleCount: number;
  /** facteur d'amplitude de dérive (mobile : plus sobre) */
  driftFactor: number;
  /** parallaxe pointeur en px (0 = désactivé) */
  parallaxPx: number;
  /** flou des vignettes lointaines (coûteux GPU : desktop only) */
  blurFar: boolean;
}

export const INTRO_DESKTOP: IntroRuntimeConfig = {
  visibleCount: 8,
  driftFactor: 1,
  parallaxPx: 10,
  blurFar: true,
};

export const INTRO_MOBILE: IntroRuntimeConfig = {
  visibleCount: 5,
  driftFactor: 0.6,
  parallaxPx: 0,
  blurFar: false,
};

export function getIntroRuntimeConfig(viewportWidth: number): IntroRuntimeConfig {
  return viewportWidth < 768 ? INTRO_MOBILE : INTRO_DESKTOP;
}

// -------------------------------------------
// Déterminisme : hash FNV-1a seedé par (id, sel)
// -------------------------------------------
export function hashSeed(key: string | number, salt = 0): number {
  const s = `${key}:${salt}`;
  let h = 2166136261 ^ (salt * 16777619);
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function rand01(key: string | number, salt: number): number {
  return (hashSeed(key, salt) % 100_000) / 100_000;
}

// -------------------------------------------
// Orbite d'un look (indépendante du viewport -> SSR stable)
// -------------------------------------------
export interface OrbitSeed {
  angle: number;
  radiusRatio: number;
  scale: number;
  /** 0 = lointain, 1 = intermédiaire, 2 = proche */
  depth: 0 | 1 | 2;
  ampX: number;
  ampY: number;
  periodX: number;
  periodY: number;
  phaseX: number;
  phaseY: number;
  entranceDelayMs: number;
}

const DRIFT_AMP_MIN = 4;
const DRIFT_AMP_MAX = 14;
const DRIFT_PERIOD_MAX = 13;
const ENTRANCE_STAGGER_MS = 110;
const ENTRANCE_BASE_MS = 350;

export function buildOrbitSeed(key: string | number, index: number): OrbitSeed {
  const angle = index * GOLDEN_ANGLE + (rand01(key, 1) - 0.5) * 2 * ANGLE_JITTER_MAX;
  const radiusRatio = lerp(RADIUS_RATIO_MIN, RADIUS_RATIO_MAX, rand01(key, 2));
  const scale = lerp(SCALE_MIN, SCALE_MAX, rand01(key, 3));
  const depthRoll = rand01(key, 4);
  const depth: 0 | 1 | 2 = depthRoll < 0.35 ? 0 : depthRoll < 0.75 ? 1 : 2;

  // Périodes incommensurables garanties : périodes de bases différentes
  // (7-10 s et 10-13 s) -> le Lissajous ne se referme jamais visuellement.
  return {
    angle,
    radiusRatio,
    scale,
    depth,
    ampX: lerp(DRIFT_AMP_MIN, DRIFT_AMP_MAX, rand01(key, 5)),
    ampY: lerp(DRIFT_AMP_MIN, DRIFT_AMP_MAX, rand01(key, 6)),
    periodX: lerp(7, 10, rand01(key, 7)),
    periodY: lerp(10, DRIFT_PERIOD_MAX, rand01(key, 8)),
    phaseX: rand01(key, 9) * Math.PI * 2,
    phaseY: rand01(key, 10) * Math.PI * 2,
    entranceDelayMs: ENTRANCE_BASE_MS + index * ENTRANCE_STAGGER_MS + rand01(key, 11) * 80,
  };
}

// -------------------------------------------
// Dérive Lissajous (px) à l'instant t (ms)
// -------------------------------------------
export function driftOffset(seed: OrbitSeed, tMs: number, factor = 1): { x: number; y: number } {
  return {
    x: Math.sin((tMs / 1000 / seed.periodX) * Math.PI * 2 + seed.phaseX) * seed.ampX * factor,
    y: Math.sin((tMs / 1000 / seed.periodY) * Math.PI * 2 + seed.phaseY) * seed.ampY * factor,
  };
}

// -------------------------------------------
// Cascade d'entrée : 0 avant le délai, ease-out-quart, 1 après 700 ms
// -------------------------------------------
export function entranceProgress(seed: OrbitSeed, tMs: number): number {
  const u = (tMs - seed.entranceDelayMs) / ENTRANCE_DURATION_MS;
  if (u <= 0) return 0;
  if (u >= 1) return 1;
  return 1 - Math.pow(1 - u, 4);
}

// -------------------------------------------
// Position centrale (px, relative au centre du conteneur)
// -------------------------------------------
export function computePlacement(seed: OrbitSeed, width: number, height: number): { x: number; y: number } {
  const radius = seed.radiusRatio * Math.min(width, height);
  return { x: Math.cos(seed.angle) * radius, y: Math.sin(seed.angle) * radius };
}

// -------------------------------------------
// Profondeur -> facteurs (parallaxe, z)
// -------------------------------------------
export function parallaxFactor(depth: 0 | 1 | 2): number {
  return depth === 2 ? 1 : depth === 1 ? 0.7 : 0.35;
}

// -------------------------------------------
// Sélection déterministe étalée (jamais deux fois le même look)
// -------------------------------------------
export function pickOutfits<T extends { id: string }>(outfits: T[], count: number): T[] {
  if (outfits.length <= count) return outfits;
  const stride = outfits.length / count;
  const picked: T[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < count && picked.length < count; i += 1) {
    const candidate = outfits[Math.min(outfits.length - 1, Math.floor(i * stride))];
    if (!seen.has(candidate.id)) {
      seen.add(candidate.id);
      picked.push(candidate);
    }
  }
  return picked;
}

// -------------------------------------------
// Taille CSS d'une vignette : clamp responsif UNIQUE (SSR stable),
// bornes multipliées par l'échelle seedée.
// -------------------------------------------
export function vignetteSizeStyle(seed: OrbitSeed): { width: string; height: string } {
  const min = Math.round(96 * seed.scale);
  const max = Math.round(210 * seed.scale);
  return {
    width: `clamp(${min}px, calc(24vw * ${seed.scale.toFixed(2)}), ${max}px)`,
    height: `clamp(${Math.round(min * OUTFIT_IMAGE_RATIO)}px, calc(31.5vw * ${seed.scale.toFixed(2)}), ${Math.round(max * OUTFIT_IMAGE_RATIO)}px)`,
  };
}

// -------------------------------------------
// OV-3 — Convergence & transition (scrub sticky)
// -------------------------------------------
export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** Course utile du sticky : hauteur de section moins un viewport (>0). */
export function sectionCourse(sectionHeight: number, viewportHeight: number): number {
  return Math.max(1, sectionHeight - viewportHeight);
}

/**
 * Progression de la séquence : p=0 quand le haut de la section atteint le
 * haut du viewport, p=1 à la fin du sticky (scroll 100 % natif).
 */
export function scrollProgress(scrollY: number, sectionTop: number, course: number): number {
  return clamp01((scrollY - sectionTop) / course);
}

/**
 * Délai individuel de convergence : les vignettes LOINTAINES convergent en
 * premier, les proches en dernier (l'orbite se ferme comme une main).
 * Borné par CONVERGENCE_STAGGER pour que tout soit convergé à p=1.
 */
export const CONVERGENCE_STAGGER = 0.25;

export function convergenceDelay(seed: OrbitSeed): number {
  const norm = (seed.radiusRatio - RADIUS_RATIO_MIN) / (RADIUS_RATIO_MAX - RADIUS_RATIO_MIN);
  // norm ~0 = lointaine -> délai court (converge en premier) ;
  // norm ~1 = proche -> délai maximal (ferme la main en dernier).
  return clamp01(norm) * CONVERGENCE_STAGGER;
}

/** Sous-progression locale d'une vignette (0 avant son délai, 1 à p=1). */
export function localProgress(p: number, delay: number): number {
  return clamp01((p - delay) / (1 - delay));
}

/**
 * Cible de convergence : la vignette glisse LE LONG de son rayon d'origine
 * vers un halo resserré derrière le monogramme (pas un empilement en un
 * point : les looks COMPOSENT le logo).
 */
export const WATERMARK_TARGET_MIN = 0.05;
export const WATERMARK_TARGET_MAX = 0.15;

export function convergeTarget(seed: OrbitSeed, width: number, height: number): { x: number; y: number } {
  const radius = lerp(WATERMARK_TARGET_MIN, WATERMARK_TARGET_MAX, rand01(seed.angle, 12)) * Math.min(width, height);
  return { x: Math.cos(seed.angle) * radius, y: Math.sin(seed.angle) * radius };
}

/** État final du champ : filigrane discret derrière le logo. */
export const WATERMARK_OPACITY = 0.08;
export const WATERMARK_SCALE = 0.55;

/** Évolution du logo central pendant la convergence (or lumineux). */
export function logoState(p: number): { opacity: number; brightness: number; scale: number } {
  const e = easeInOutCubic(p);
  return {
    opacity: lerp(0.85, 1, e),
    brightness: lerp(1, 1.6, e),
    scale: lerp(1, 1.04, e),
  };
}
