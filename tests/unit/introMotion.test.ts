import { describe, it, expect } from 'vitest';
import {
  GOLDEN_ANGLE,
  RADIUS_RATIO_MAX,
  RADIUS_RATIO_MIN,
  SCALE_MAX,
  SCALE_MIN,
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

// Garde-fous OV-2 (champ organique) + OV-3 (convergence & transition).
// Toutes les maths sont PURES et DÉTERMINISTES : mêmes entrées -> mêmes
// sorties (rendu stable, SSR sûr, tests reproductibles).
//
// NOTE : ce fichier reconstruit intégralement les 10 garde-fous OV-2
// (le commit ebf2665 les avait perdus — fichier vide) et y ajoute les
// 8 garde-fous OV-3.
describe('Unit — OV-2 introMotion : champ organique', () => {
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

  it('bornes : rayons, échelles, profondeurs, amplitudes, périodes', () => {
    for (const seed of seeds) {
      expect(seed.radiusRatio).toBeGreaterThanOrEqual(RADIUS_RATIO_MIN);
      expect(seed.radiusRatio).toBeLessThanOrEqual(RADIUS_RATIO_MAX);
      expect(seed.scale).toBeGreaterThanOrEqual(SCALE_MIN);
      expect(seed.scale).toBeLessThanOrEqual(SCALE_MAX);
      expect([0, 1, 2]).toContain(seed.depth);
      expect(seed.ampX).toBeGreaterThanOrEqual(4);
      expect(seed.ampX).toBeLessThanOrEqual(14);
      expect(seed.periodX).toBeGreaterThanOrEqual(7);
      expect(seed.periodY).toBeLessThanOrEqual(13);
    }
  });

  it('Lissajous : périodes X/Y incommensurables et dérive bornée', () => {
    for (const seed of seeds) {
      expect(Math.abs(seed.periodX - seed.periodY)).toBeGreaterThan(0.5);
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

  it('cascade d’entrée : 0 avant délai, monotone, 1 après 700 ms', () => {
    const seed = seeds[2];
    expect(entranceProgress(seed, seed.entranceDelayMs - 1)).toBe(0);
    expect(entranceProgress(seed, seed.entranceDelayMs + 350)).toBeGreaterThan(0);
    expect(entranceProgress(seed, seed.entranceDelayMs + 350)).toBeLessThan(1);
    expect(entranceProgress(seed, seed.entranceDelayMs + 701)).toBe(1);
    expect(seeds[1].entranceDelayMs).toBeGreaterThan(seeds[0].entranceDelayMs);
  });

  it('placement : centre + rayon borné par min(width, height)', () => {
    for (const seed of seeds) {
      const { x, y } = computePlacement(seed, 1200, 800);
      const dist = Math.hypot(x, y);
      expect(dist).toBeGreaterThanOrEqual(RADIUS_RATIO_MIN * 800 - 1);
      expect(dist).toBeLessThanOrEqual(RADIUS_RATIO_MAX * 800 + 1);
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

  it('profondeur -> facteurs de parallaxe croissants', () => {
    expect(parallaxFactor(0)).toBeLessThan(parallaxFactor(1));
    expect(parallaxFactor(1)).toBeLessThan(parallaxFactor(2));
  });

  it('vignetteSizeStyle : clamp responsif unique borné par l’échelle', () => {
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
    expect(sectionCourse(500, 800)).toBe(1); // jamais 0 (division par zéro impossible)
  });

  it('scrollProgress : 0 au sommet de section, 1 en fin de sticky, clampé', () => {
    const top = 1000;
    const course = 700;
    expect(scrollProgress(500, top, course)).toBe(0);
    expect(scrollProgress(1000, top, course)).toBe(0);
    expect(scrollProgress(1350, top, course)).toBeCloseTo(0.5, 6);
    expect(scrollProgress(1700, top, course)).toBe(1);
    expect(scrollProgress(99999, top, course)).toBe(1);
  });

  it('convergenceDelay : les LOINTAINES convergent en premier (délai plus court)', () => {
    const near = seeds.reduce((a, b) => (a.radiusRatio > b.radiusRatio ? a : b));
    const far = seeds.reduce((a, b) => (a.radiusRatio < b.radiusRatio ? a : b));
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
      // Même direction que l'orbite (glissement radial, pas de croisement).
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
