// src/components/public/intro/introMotion.ts
// OV-2 — Maths PURES du champ organique (aucune dépendance React/DOM :
// entièrement testables unitairement, exécutables côté serveur).
// OV-3 — Convergence & transition (scrub sticky).
// OV-3c — Composition en COQUES jitterées (taille ∝ profondeur, ellipse
//         adaptée à l'aspect, entrée back-to-front) : le champ occupe
//         réellement l'espace, les vignettes proches frôlent le logo.
//
// Principes anti « carrousel mécanique » :
// - angle doré (137,508°) entre voisins + jitter individuel ±28° :
//   jamais un cercle parfait, jamais une rotation continue ;
// - TROIS coques qui se CHEVAUCHENT (proche/médiane/lointaine) : le rayon,
//   l'échelle, le flou, la vitesse de dérive et la parallaxe sont tous
//   corrélés à la profondeur -> l'espace est lisible ;
// - dérive = 2 sinusoïdes INCOMMENSURABLES (Lissajous) : la scène vit
//   sans boucle perceptible ;
// - cascade d'entrée back-to-front : l'arrière-plan se construit d'abord.
//
// Déterminisme total : same id -> same orbite (re-rendu stable, SSR sûr).

export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5)); // ≈ 2,39996 rad = 137,508°
export const RADIUS_RATIO_MIN = 0.2;
export const RADIUS_RATIO_MAX = 0.62;
export const SCALE_MIN = 0.62;
export const SCALE_MAX = 1.3;
export const ANGLE_JITTER_MAX = (28 * Math.PI) / 180;
export const ENTRANCE_DURATION_MS = 700;
export const OUTFIT_IMAGE_RATIO = 1086 / 828; // portrait source des visuels looks

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

// -------------------------------------------
// Coques de profondeur (rayon / échelle / dérive corrélés, bornes qui se
// chevauchent volontairement : jamais trois « anneaux » lisibles).
// -------------------------------------------
export interface IntroShell {
  radiusMin: number;
  radiusMax: number;
  scaleMin: number;
  scaleMax: number;
  driftAmpMin: number;
  driftAmpMax: number;
  driftPeriodMin: number;
  driftPeriodMax: number;
  /** respiration d'échelle : amplitude (±) et période, par coque */
  breathMin: number;
  breathMax: number;
}

// Marge de clamp (finalisation 09/2026) : la parallaxe desktop vaut 10 px
// pire cas (voir INTRO_CFG plus bas) — conservée en constante pour que le
// clamp reste une fonction pure, sans dépendance à la config runtime.
const PARALLAX_MARGIN_PX = 10;

export const INTRO_SHELLS: Record<0 | 1 | 2, IntroShell> = {
  // OV-3f — occupation PLEINE de l'écran : lointaine poussée vers les bords
  // (0,55-0,88 × min(w,h), ellipse ×1,18 en x -> léger bleed hors cadre),
  // échelles resserrées (0,72-0,92) pour mettre PLUS de looks en valeur.
  0: { radiusMin: 0.55, radiusMax: 0.88, scaleMin: 0.72, scaleMax: 0.92, driftAmpMin: 6, driftAmpMax: 14, driftPeriodMin: 9, driftPeriodMax: 13, breathMin: 0.012, breathMax: 0.02 },
  // médiane : couronne intermédiaire élargie
  1: { radiusMin: 0.38, radiusMax: 0.6, scaleMin: 0.95, scaleMax: 1.12, driftAmpMin: 10, driftAmpMax: 22, driftPeriodMin: 8, driftPeriodMax: 11, breathMin: 0.018, breathMax: 0.028 },
  // proche : interne, la plus grande — frôle le logo sans le masquer
  2: { radiusMin: 0.22, radiusMax: 0.38, scaleMin: 1.14, scaleMax: 1.32, driftAmpMin: 14, driftAmpMax: 30, driftPeriodMin: 7, driftPeriodMax: 10, breathMin: 0.025, breathMax: 0.04 },
};

// Stratification des coques PAR INDEX (constat utilisateur : avec la coque
// tirée par hash, 2-3 grandes pouvaient atterrir dans le même quadrant et
// tout le champ visuel basculait d'un côté). Le pattern place chaque coque
// sur des angles opposés de la spirale dorée : médianes aux indices
// 0/2/4/6 (0°/275°/190°/105°), lointaines 1/5 (137°/327°), proches 3/7
// (52°/242°) — le champ est équilibré autour du logo PAR CONSTRUCTION,
// pour n'importe quel hash des amplitudes. Le premier quintet (mobile)
// reste lui aussi équilibré (1 loin / 3 médianes / 1 proche).
const SHELL_PATTERN: Array<0 | 1 | 2> = [1, 2, 0, 1, 1, 2, 0, 2, 1];

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
  /** 0 = lointaine, 1 = médiane, 2 = proche */
  depth: 0 | 1 | 2;
  ampX: number;
  ampY: number;
  periodX: number;
  periodY: number;
  phaseX: number;
  phaseY: number;
  entranceDelayMs: number;
  breathAmp: number;
  breathPeriodMs: number;
}

const ENTRANCE_BASE_MS = 300;
const ENTRANCE_DEPTH_STAGGER_MS = 220;

export function buildOrbitSeed(key: string | number, index: number): OrbitSeed {
  const angle = index * GOLDEN_ANGLE + (rand01(key, 1) - 0.5) * 2 * ANGLE_JITTER_MAX;

  // Profondeur STRATIFIÉE par index (voir SHELL_PATTERN) : l'équilibre
  // angulaire du champ est garanti par construction, et TOUT le caractère
  // visuel (rayon/échelle/dérive/révolution) dérive de la coque.
  const depth: 0 | 1 | 2 = SHELL_PATTERN[((index % SHELL_PATTERN.length) + SHELL_PATTERN.length) % SHELL_PATTERN.length];
  const shell = INTRO_SHELLS[depth];

  const radiusRatio = lerp(shell.radiusMin, shell.radiusMax, rand01(key, 2));
  const scale = lerp(shell.scaleMin, shell.scaleMax, rand01(key, 3));

  // Périodes incommensurables GARANTIES : periodY toujours décalé de
  // periodX d'au moins 1,2 s (le Lissajous ne se referme jamais).
  const periodX = lerp(shell.driftPeriodMin, shell.driftPeriodMax, rand01(key, 7));
  const periodY = periodX + lerp(1.2, 3, rand01(key, 8));
  return {
    angle,
    radiusRatio,
    scale,
    depth,
    ampX: lerp(shell.driftAmpMin, shell.driftAmpMax, rand01(key, 5)),
    ampY: lerp(shell.driftAmpMin, shell.driftAmpMax, rand01(key, 6)),
    periodX,
    periodY,
    phaseX: rand01(key, 9) * Math.PI * 2,
    phaseY: rand01(key, 10) * Math.PI * 2,
    // Back-to-front : l'arrière-plan (lointaines, floues) se construit
    // d'abord, les proches émergent en dernier (la profondeur devient un
    // récit d'entrée).
    entranceDelayMs:
      ENTRANCE_BASE_MS + depth * ENTRANCE_DEPTH_STAGGER_MS + rand01(key, 11) * 120,
    // Respiration : l'échelle oscille très subtilement (± 1,2-4 %), périodes
    // 7-12 s hashées, désynchronisées — « les images vivent », elles ne
    // tournent pas (pas de révolution : positions angulaires FIXES).
    breathAmp: lerp(shell.breathMin, shell.breathMax, rand01(key, 13)),
    breathPeriodMs: lerp(7_000, 12_000, rand01(key, 14)),
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
// Position centrale (px, relative au centre du conteneur).
// OV-3c : champ ELLIPTIQUE adapté à l'aspect — en paysage le champ
// s'élargit (×1.06 / 0.82) pour occuper l'écran large ; en portrait il
// se resserre horizontalement (×0.86) pour préserver la lisibilité.
// -------------------------------------------
// -------------------------------------------
// Finalisation 09/2026 — SAFE ZONE du logo : les vignettes gravitent AUTOUR
// du monogramme, jamais à travers. Le rect est dérivé de la MÊME règle que le
// CSS du logo (w-[min(62vw,300px)], proportions natives 640×642) + le texte
// « HP Collection » sous le logo : aucune seconde source de vérité.
// -------------------------------------------
export interface LogoSafeBox {
  halfWidth: number;
  halfHeight: number;
  /** extension basse : gap + texte « HP Collection » sous le monogramme */
  bottomExtra: number;
}

export function logoSafeBox(width: number, height: number): LogoSafeBox {
  const logoW = Math.min(0.62 * width, 300);
  const logoH = logoW * (642 / 640);
  const landscape = width >= height;
  const pad = logoW * (landscape ? 0.16 : 0.14);
  return { halfWidth: logoW / 2 + pad, halfHeight: logoH / 2 + pad, bottomExtra: 52 };
}

/** Repousse un point hors du rect protégé (poussée au bord le plus proche,
 *  axe dominant) — déterministe, O(1), sans boucle. Les points déjà dehors
 *  sont renvoyés tels quels : la composition organique est préservée. */
export function clampOutsideLogoSafeZone(
  x: number,
  y: number,
  box: LogoSafeBox,
  margin = 0
): { x: number; y: number } {
  // La dérive Lissajous + la parallaxe bougent la vignette APRÈS le
  // placement : sans marge, une vignette clampée au bord exact remonte
  // progressivement sur le logo (mesuré : jusqu'à ~28 px desktop). Le
  // clamp pousse donc à bord + marge = amplitude max de la coque +
  // parallaxe, pour que place + dérive + parallaxe reste hors du logo.
  // La zone est DILATÉE par la marge : un point collé au bord (même 0,5 px
  // à l'extérieur) finit par re-traverser avec la dérive — il doit être
  // repoussé au bord dilaté. Les vignettes naturellement plus loin que la
  // marge ne bougent pas (composition organique préservée).
  const top = -box.halfHeight - margin;
  const bottom = box.halfHeight + box.bottomExtra + margin;
  const left = -box.halfWidth - margin;
  const right = box.halfWidth + margin;
  const inside = x > left && x < right && y > top && y < bottom;
  if (!inside) return { x, y };
  const dx = x >= 0 ? right - x : left - x;
  const dy = y >= 0 ? bottom - y : top - y;
  if (dx < dy) return { x: x >= 0 ? right : left, y };
  return { x, y: y >= 0 ? bottom : top };
}

export function computePlacement(seed: OrbitSeed, width: number, height: number): { x: number; y: number } {
  // OV-3f : ellipse ÉLARGIE — le champ occupe tout l'écran (léger bleed
  // horizontal en paysage, vertical contenu), au lieu d'un périmètre
  // resserré autour du logo.
  const landscape = width >= height;
  const ax = landscape ? 1.18 : 0.88;
  const ay = landscape ? 0.74 : 1.06;
  const radius = seed.radiusRatio * Math.min(width, height);
  // Position angulaire FIXE (pas de révolution circulaire) : la vie du champ
  // vient de la dérive Lissajous + la respiration d'échelle (voir
  // driftOffset / breathScale). Coordonnées RELATIVES AU CENTRE du champ —
  // l'ancrage du nœud DOM doit être left-1/2 top-1/2 (garde unitaire).
  const raw = { x: Math.cos(seed.angle) * radius * ax, y: Math.sin(seed.angle) * radius * ay };
  // Safe zone : AUTOUR du logo, jamais dessus (finalisation 09/2026).
  // Marge = amplitude de dérive max de la coque + parallaxe pire cas
  // (facteur 1 en desktop) : la dérive ne peut pas re-traverser le bord.
  const shell = INTRO_SHELLS[seed.depth];
  const margin = shell.driftAmpMax + PARALLAX_MARGIN_PX;
  return clampOutsideLogoSafeZone(raw.x, raw.y, logoSafeBox(width, height), margin);
}

// -------------------------------------------
// Respiration d'échelle : oscillation subtile ± breathAmp (1,2-4 %),
// périodes 7-12 s désynchronisées par phase — transform/opacity only.
// -------------------------------------------
export function breathScale(seed: OrbitSeed, tMs: number): number {
  return 1 + seed.breathAmp * Math.sin((tMs / seed.breathPeriodMs) * Math.PI * 2 + seed.phaseX);
}

// -------------------------------------------
// OV-3f — Rotation de la GALERIE : à l'arrêt (avant le scroll), un slot
// « rend » son look et en accueille un autre de la galerie complète, en
// fondu (sortie 550 ms, entrée 700 ms). Micro-animation INTERNE : elle ne
// fait JAMAIS avancer la page (aucun scroll), se met en pause avec la
// boucle rAF (hors écran / onglet caché) et est désactivée sous
// prefers-reduced-motion. Un seul remplacement à la fois, round-robin.
// -------------------------------------------
export const ROTATION_INTERVAL_MS = 5_200;
export const FADE_OUT_MS = 550;
export const FADE_IN_MS = 700;

/** index de remplacement déterministe : 0,1,2,… slots par intervalle écoulé */
export function rotationCounter(tMs: number, intervalMs = ROTATION_INTERVAL_MS): number {
  return Math.max(0, Math.floor(tMs / intervalMs));
}

/** opacité de slot (0-1) selon sa phase d'entrée/sortie en fondu */
export function slotFade(
  phase: 'in' | 'idle' | 'out',
  sinceMs: number,
  nowMs: number
): number {
  if (phase === 'idle') return 1;
  const u = clamp01((nowMs - sinceMs) / (phase === 'out' ? FADE_OUT_MS : FADE_IN_MS));
  return phase === 'out' ? 1 - easeInOutCubic(u) : easeInOutCubic(u);
}

// -------------------------------------------
// Profondeur -> facteurs (parallaxe croissante avec la proximité)
// -------------------------------------------
export function parallaxFactor(depth: 0 | 1 | 2): number {
  return depth === 2 ? 1.15 : depth === 1 ? 0.7 : 0.35;
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
// bornes multipliées par l'échelle seedée (∝ profondeur).
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
 * Délai individuel de convergence : les vignettes LOINTAINES (coque externe)
 * partent en PREMIER — elles ont la plus grande distance à parcourir et
 * l'orbite se ferme « comme une main » — les proches ferment la marche.
 * Borné par CONVERGENCE_STAGGER pour que tout soit convergé à p=1.
 */
export const CONVERGENCE_STAGGER = 0.25;

export function convergenceDelay(seed: OrbitSeed): number {
  const norm = (seed.radiusRatio - RADIUS_RATIO_MIN) / (RADIUS_RATIO_MAX - RADIUS_RATIO_MIN);
  // norm ~1 = lointaine -> délai court ; norm ~0 = proche -> délai maximal.
  return (1 - clamp01(norm)) * CONVERGENCE_STAGGER;
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

export function convergeTarget(
  seed: OrbitSeed,
  width: number,
  height: number,
  logoOffset: { x: number; y: number } = { x: 0, y: 0 }
): { x: number; y: number } {
  // Finalisation 09/2026 — la cible est LE LOGO RÉEL : le halo se resserre
  // autour du centre mesuré du monogramme (logoOffset, mesuré au resize dans
  // IntroStage), avec un biais vers sa zone BASSE/INTERNE (§ narration : les
  // looks pénètrent le logo, pas une zone noire indépendante sous lui).
  const box = logoSafeBox(width, height);
  const cx = logoOffset.x;
  const cy = logoOffset.y + box.halfHeight * 0.35;
  const radius = lerp(WATERMARK_TARGET_MIN, WATERMARK_TARGET_MAX, rand01(seed.angle, 12)) * Math.min(width, height);
  return { x: cx + Math.cos(seed.angle) * radius, y: cy + Math.sin(seed.angle) * radius };
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
