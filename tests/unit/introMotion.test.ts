import { describe, it, expect } from 'vitest';
import {
  GOLDEN_ANGLE,
  INTRO_SHELLS,
  RADIUS_RATIO_MAX,
  RADIUS_RATIO_MIN,
  WATERMARK_OPACITY,
  WATERMARK_SCALE,
  WATERMARK_TARGET_MAX,
  WATERMARK_TARGET_MIN,
  buildOrbitSeed,
  clamp01,
  computePlacement,
  convergenceDelay,
  convergeTarget,
  driftOffset,
  easeInOutCubic,
  entranceProgress,
  getIntroRuntimeConfig,
  hashSeed,
  localProgress,
  logoState,
  parallaxFactor,
  pickOutfits,
  rand01,
  scrollProgress,
  sectionCourse,
  vignetteSizeStyle,
} from '@/components/public/intro/introMotion';

// Garde-fous OV-2 (champ organique) + OV-3 (convergence) + OV-3c (coques).
// Toutes les maths sont PURES et DÉTERMINISTES : mêmes entrées -> mêmes
// sorties (rendu stable, SSR sûr, tests reproductibles).
describe('Unit — OV-2/OV-3c introMotion : champ organique en coques', () => {
  const ids = ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8'];
  const seeds = ids.map((id, index) => buildOrbitSeed(id, index));

  it('déterminisme : same (id, index) -> même orbite, ids distincts -> orbites distinctes', () => {
    expect(buildOrbitSeed('x9', 3)).toEqual(buildOrbitSeed('x9', 3));
    expect(hashSeed('x9', 1)).toBe(hashSeed('x9', 1));
    expect(rand01('x9', 1)).toBeGreaterThanOrEqual(0);
    expect(rand01('x9', 1)).toBeLessThan(1);
    const angles = new Set(seeds.map((seed) => seed.angle));
    expect(angles.size).toBe(seeds.length);
  });

  it('anti-cercle : espacements angulaires irréguliers (jitter autour de l’angle doré)', () => {
    const sorted = [...seeds].map((s) => s.angle).sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i += 1) gaps.push(sorted[i] - sorted[i - 1]);
    const max = Math.max(...gaps);
    const min = Math.min(...gaps);
    expect(max - min).toBeGreaterThan(0.15);
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    expect(Math.abs(mean - GOLDEN_ANGLE)).toBeLessThan(0.25);
  });

  it('OV-3c COQUES : rayon, échelle, dérive tous corrélés à la profondeur', () => {
    expect(Object.keys(INTRO_SHELLS)).toEqual(['0', '1', '2']);
    // Bornes globales couvertes par l'union des coques (chevauchement voulu).
    expect(RADIUS_RATIO_MIN).toBeLessThan(INTRO_SHELLS[1].radiusMin);
    expect(RADIUS_RATIO_MAX).toBeGreaterThan(INTRO_SHELLS[1].radiusMax);
    for (const seed of seeds) {
      const shell = INTRO_SHELLS[seed.depth];
      expect(seed.radiusRatio).toBeGreaterThanOrEqual(shell.radiusMin);
      expect(seed.radiusRatio).toBeLessThanOrEqual(shell.radiusMax);
      expect(seed.scale).toBeGreaterThanOrEqual(shell.scaleMin);
      expect(seed.scale).toBeLessThanOrEqual(shell.scaleMax);
      expect(seed.ampX).toBeGreaterThanOrEqual(shell.driftAmpMin);
      expect(seed.ampX).toBeLessThanOrEqual(shell.driftAmpMax);
      expect(seed.periodX).toBeGreaterThanOrEqual(shell.driftPeriodMin);
      expect(seed.periodX).toBeLessThanOrEqual(shell.driftPeriodMax);
    }
    // Hiérarchie des coques : proche = grand + interne, lointaine = petit + externe.
    expect(INTRO_SHELLS[2].scaleMin).toBeGreaterThan(INTRO_SHELLS[0].scaleMax);
    expect(INTRO_SHELLS[2].radiusMax).toBeLessThan(INTRO_SHELLS[0].radiusMin);
  });

  it('OV-3c PROFONDEUR lisible : toute paire far/near — petite+externe vs grande+interne', () => {
    // Population large déterministe : les 8 ids de base ne tirent aucune
    // coque proche (profondeur 2) — on ne dépend jamais d'un tirage.
    const population = Array.from({ length: 40 }, (_, i) => buildOrbitSeed(`pop${i}`, i));
    const far = population.filter((s) => s.depth === 0);
    const near = population.filter((s) => s.depth === 2);
    expect(far.length).toBeGreaterThan(3);
    expect(near.length).toBeGreaterThan(3);
    for (const f of far) {
      for (const n of near) {
        expect(f.scale).toBeLessThan(n.scale);
        expect(f.radiusRatio).toBeGreaterThan(n.radiusRatio);
      }
    }
  });

  it('Lissajous : périodes X/Y incommensurables et dérive bornée', () => {
    for (const seed of seeds) {
      expect(Math.abs(seed.periodX - seed.periodY)).toBeGreaterThanOrEqual(1.2);
      for (let t = 0; t < 20_000; t += 733) {
        const { x, y } = driftOffset(seed, t);
        expect(Math.abs(x)).toBeLessThanOrEqual(seed.ampX + 1e-9);
        expect(Math.abs(y)).toBeLessThanOrEqual(seed.ampY + 1e-9);
      }
    }
    const seed = seeds[0];
    const full = driftOffset(seed, 5_000, 1);
    const mobile = driftOffset(seed, 5_000, 0.6);
    expect(Math.abs(mobile.x)).toBeLessThanOrEqual(Math.abs(full.x) + 1e-9);
  });

  it('cascade d’entrée BACK-TO-FRONT : les lointaines apparaissent avant les proches', () => {
    const population = Array.from({ length: 40 }, (_, i) => buildOrbitSeed(`pop${i}`, i));
    const far = population.filter((s) => s.depth === 0);
    const near = population.filter((s) => s.depth === 2);
    expect(far.length).toBeGreaterThan(3);
    expect(near.length).toBeGreaterThan(3);
    for (const f of far) for (const n of near) expect(f.entranceDelayMs).toBeLessThan(n.entranceDelayMs);
    const seed = seeds[2];
    expect(entranceProgress(seed, seed.entranceDelayMs - 1)).toBe(0);
    expect(entranceProgress(seed, seed.entranceDelayMs + 701)).toBe(1);
  });

  it('OV-3c ELLIPSE : champ plus large que haut en paysage, resserré en portrait', () => {
    let maxX = 0;
    let maxY = 0;
    for (const seed of seeds) {
      const { x, y } = computePlacement(seed, 1280, 720);
      maxX = Math.max(maxX, Math.abs(x));
      maxY = Math.max(maxY, Math.abs(y));
      // Bornes anisotropes : x ≤ r·1.06·min, y ≤ r·0.82·min (paysage).
      expect(Math.abs(x)).toBeLessThanOrEqual(seed.radiusRatio * 720 * 1.06 + 1);
      expect(Math.abs(y)).toBeLessThanOrEqual(seed.radiusRatio * 720 * 0.82 + 1);
    }
    expect(maxX).toBeGreaterThan(maxY); // champ étalé horizontalement
    // Portrait : axe x comprimé (×0.86) — lisibilité préservée sur mobile.
    const portrait = computePlacement(seeds[0], 390, 844);
    expect(Math.abs(portrait.x)).toBeLessThanOrEqual(seeds[0].radiusRatio * 390 * 0.86 + 1);
  });

  it('OV-3c-2 ÉQUILIBRE : le champ ne bascule jamais d’un côté (régression photo user)', () => {
    // Constat utilisateur (photo) : avec la coque tirée par HASH, 2-3
    // grandes vignettes atterrissaient dans le même quadrant -> tout le
    // champ visuel s'empilait d'un côté. La stratification SHELL_PATTERN
    // place chaque coque à des angles opposés : le centroïde des 8
    // placements reste proche du centre POUR TOUT HASH (mesuré 2-11 % du
    // rayon max ; l'ancien code donnait ~20 %+ vers un seul quadrant).
    const circDist = (a: number, b: number) => Math.abs(((a - b) % Math.PI + Math.PI) % Math.PI);
    for (const prefix of ['a', 'pop', 'zz', 'k9']) {
      const seeds8 = Array.from({ length: 8 }, (_, i) => buildOrbitSeed(`${prefix}${i}`, i));
      expect(seeds8.filter((s) => s.depth === 0)).toHaveLength(2);
      expect(seeds8.filter((s) => s.depth === 1)).toHaveLength(4);
      expect(seeds8.filter((s) => s.depth === 2)).toHaveLength(2);
      let sx = 0;
      let sy = 0;
      let maxR = 0;
      for (const seed of seeds8) {
        const { x, y } = computePlacement(seed, 1280, 720);
        sx += x;
        sy += y;
        maxR = Math.max(maxR, seed.radiusRatio);
      }
      const deviation = Math.hypot(sx / 8, sy / 8) / (maxR * 720);
      expect(deviation).toBeLessThan(0.15);
      // Chaque coque couvre le cercle : coques 2-échantillons en angles
      // quasi opposés, médianes en 4 façades.
      const farAngles = seeds8.filter((s) => s.depth === 0).map((s) => s.angle);
      const nearAngles = seeds8.filter((s) => s.depth === 2).map((s) => s.angle);
      expect(circDist(farAngles[0], farAngles[1])).toBeGreaterThan(2.3);
      expect(circDist(nearAngles[0], nearAngles[1])).toBeGreaterThan(2.3);
      const midAngles = seeds8
        .filter((s) => s.depth === 1)
        .map((s) => s.angle)
        .map((a) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2))
        .sort((a, b) => a - b);
      let maxGap = 0;
      for (let i = 0; i < 4; i += 1) {
        const next = i === 3 ? midAngles[0] + Math.PI * 2 : midAngles[i + 1];
        maxGap = Math.max(maxGap, next - midAngles[i]);
      }
      expect(maxGap).toBeLessThan(3.0);
    }
  });

  it('OV-3c-2 GRAVITATION : chaque vignette DÉCRIT son orbite autour du logo', () => {
    const seed = buildOrbitSeed('g1', 3);
    const a = computePlacement(seed, 1280, 720, 0);
    const b = computePlacement(seed, 1280, 720, 5_000);
    // Module constant : l'orbite déplace la vignette SUR son cercle,
    // elle ne déforme pas le champ.
    const normR = (pt: { x: number; y: number }) => Math.hypot(pt.x / 1.06, pt.y / 0.82);
    expect(Math.abs(normR(a) - normR(b))).toBeLessThan(0.5);
    // 5 s -> déplacement net et visible (> 20 px).
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeGreaterThan(20);
    // t=0 = phase initiale : le mode statique (reduced-motion) est figé.
    expect(computePlacement(seed, 1280, 720, 0)).toEqual(a);
    // Vitesses par couche : les proches balaient plus d'angle que les
    // lointaines à durée égale (bandes 150-190 / 105-135 / 80-105 s).
    const population = Array.from({ length: 24 }, (_, i) => buildOrbitSeed(`orb${i}`, i));
    const sweep = (depth: 0 | 1 | 2) =>
      Math.min(...population.filter((sd) => sd.depth === depth).map((sd) => sd.orbitPeriodMs));
    expect(sweep(2)).toBeLessThan(sweep(1));
    expect(sweep(1)).toBeLessThan(sweep(0));
    for (const sd of population) {
      expect(sd.orbitPeriodMs).toBeGreaterThanOrEqual(80_000);
      expect(sd.orbitPeriodMs).toBeLessThanOrEqual(190_000);
    }
  });

  it('OV-3c GRAVITATION : les vignettes proches frôlent la zone du logo', () => {
    const near = seeds.filter((s) => s.depth === 2);
    for (const seed of near) {
      const { x, y } = computePlacement(seed, 1280, 720);
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(0.34 * 720 * 1.06 + 1);
    }
  });

  it('pickOutfits : étalement, jamais de doublon, clamp au disponible', () => {
    const list = Array.from({ length: 32 }, (_, i) => ({ id: `o${i}` }));
    const picked = pickOutfits(list, 8);
    expect(picked).toHaveLength(8);
    expect(new Set(picked.map((o) => o.id)).size).toBe(8);
    expect(picked[0].id).toBe('o0');
    expect(picked[7].id).toBe('o28');
    expect(pickOutfits(list.slice(0, 3), 8)).toHaveLength(3);
  });

  it('runtime config : mobile sobre, desktop complet', () => {
    expect(getIntroRuntimeConfig(390).visibleCount).toBe(5);
    expect(getIntroRuntimeConfig(390).parallaxPx).toBe(0);
    expect(getIntroRuntimeConfig(390).blurFar).toBe(false);
    expect(getIntroRuntimeConfig(1440).visibleCount).toBe(8);
    expect(getIntroRuntimeConfig(1440).parallaxPx).toBe(10);
    expect(getIntroRuntimeConfig(1440).blurFar).toBe(true);
  });

  it('profondeur -> facteurs de parallaxe croissants (proche plus vive)', () => {
    expect(parallaxFactor(0)).toBeLessThan(parallaxFactor(1));
    expect(parallaxFactor(1)).toBeLessThan(parallaxFactor(2));
    expect(parallaxFactor(2)).toBeCloseTo(1.15, 6);
  });

  it('vignetteSizeStyle : clamp responsif unique borné par l’échelle (∝ profondeur)', () => {
    for (const seed of seeds) {
      const size = vignetteSizeStyle(seed);
      expect(size.width).toContain('clamp(');
      expect(size.height).toContain('clamp(');
      expect(size.width).toContain(String(Math.round(96 * seed.scale)));
      expect(size.width).toContain(String(Math.round(210 * seed.scale)));
    }
  });
});

describe('Unit — OV-3 introMotion : convergence & transition', () => {
  const ids = ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7', 'h8'];
  const seeds = ids.map((id, index) => buildOrbitSeed(id, index));

  it('clamp01 / sectionCourse : bornes et garde-fou division', () => {
    expect(clamp01(-5)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(5)).toBe(1);
    expect(sectionCourse(1500, 800)).toBe(700);
    expect(sectionCourse(500, 800)).toBe(1);
  });

  it('scrollProgress : 0 au sommet de section, 1 en fin de sticky, clampé', () => {
    expect(scrollProgress(500, 1000, 700)).toBe(0);
    expect(scrollProgress(1000, 1000, 700)).toBe(0);
    expect(scrollProgress(1350, 1000, 700)).toBeCloseTo(0.5, 6);
    expect(scrollProgress(1700, 1000, 700)).toBe(1);
    expect(scrollProgress(99999, 1000, 700)).toBe(1);
  });

  it('convergenceDelay : les LOINTAINES (externes) convergent en premier', () => {
    // far = rayon max (coque externe) ; near = rayon min (coque interne).
    const near = seeds.reduce((a, b) => (a.radiusRatio < b.radiusRatio ? a : b));
    const far = seeds.reduce((a, b) => (a.radiusRatio > b.radiusRatio ? a : b));
    expect(convergenceDelay(far)).toBeLessThan(convergenceDelay(near));
    for (const seed of seeds) {
      expect(convergenceDelay(seed)).toBeGreaterThanOrEqual(0);
      expect(convergenceDelay(seed)).toBeLessThanOrEqual(0.25);
    }
  });

  it('localProgress : 0 avant le délai, monotone, 1 à p=1 (tout converge à la fin)', () => {
    for (const delay of [0, 0.1, 0.25]) {
      expect(localProgress(0, delay)).toBe(0);
      expect(localProgress(delay * 0.5, delay)).toBe(0);
      expect(localProgress(1, delay)).toBe(1);
      const mid = localProgress((delay + 1) / 2, delay);
      expect(mid).toBeGreaterThan(0);
      expect(mid).toBeLessThan(1);
    }
  });

  it('easeInOutCubic : extrêmes exacts, monotone, symétrique', () => {
    expect(easeInOutCubic(0)).toBe(0);
    expect(easeInOutCubic(1)).toBe(1);
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5, 9);
    let previous = 0;
    for (let t = 0; t <= 1; t += 0.05) {
      const v = easeInOutCubic(t);
      expect(v).toBeGreaterThanOrEqual(previous);
      previous = v;
    }
  });

  it('convergeTarget : halo resserré DERRIÈRE le logo, le long du rayon d’origine', () => {
    for (const seed of seeds) {
      const { x, y } = convergeTarget(seed, 1200, 800);
      const dist = Math.hypot(x, y);
      expect(dist).toBeGreaterThanOrEqual(WATERMARK_TARGET_MIN * 800 - 1);
      expect(dist).toBeLessThanOrEqual(WATERMARK_TARGET_MAX * 800 + 1);
      expect(Math.sign(x)).toBe(Math.sign(Math.cos(seed.angle)));
      expect(Math.sign(y)).toBe(Math.sign(Math.sin(seed.angle)));
    }
  });

  it('filigrane : constantes d’état final cohérentes', () => {
    expect(WATERMARK_OPACITY).toBeGreaterThan(0);
    expect(WATERMARK_OPACITY).toBeLessThanOrEqual(0.15);
    expect(WATERMARK_SCALE).toBeGreaterThan(0.4);
    expect(WATERMARK_SCALE).toBeLessThan(0.7);
  });

  it('logoState : or lumineux progressif, monotone, extrêmes exacts', () => {
    const start = logoState(0);
    const end = logoState(1);
    expect(start.opacity).toBeCloseTo(0.85, 6);
    expect(start.brightness).toBe(1);
    expect(end.opacity).toBe(1);
    expect(end.brightness).toBeCloseTo(1.6, 6);
    expect(end.scale).toBeCloseTo(1.04, 6);
    let previousBrightness = 0;
    for (let p = 0; p <= 1; p += 0.05) {
      const state = logoState(p);
      expect(state.brightness).toBeGreaterThanOrEqual(previousBrightness);
      expect(state.opacity).toBeGreaterThanOrEqual(0.85);
      previousBrightness = state.brightness;
    }
  });
});
