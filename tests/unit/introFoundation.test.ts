import { describe, it, expect } from 'vitest';
import {
  GOLDEN_ANGLE,
  RADIUS_RATIO_MAX,
  RADIUS_RATIO_MIN,
  SCALE_MAX,
  SCALE_MIN,
  buildOrbitSeed,
  computePlacement,
  driftOffset,
  entranceProgress,
  getIntroRuntimeConfig,
  hashSeed,
  parallaxFactor,
  pickOutfits,
  rand01,
  vignetteSizeStyle,
} from '@/components/public/intro/introMotion';

// Garde-fous OV-2 — Maths du champ organique (pures, déterministes).
// Objectifs vérifiés :
// - déterminisme total (same id -> same orbite) ;
// - ANTI-CERCLE : angles tous distincts, espacements irréguliers (jitter) ;
// - bornes strictes : rayons, échelles, amplitudes, périodes ;
// - Lissajous : périodes X/Y incommensurables (jamais de boucle fermée) ;
// - cascade d'entrée monotone et encadrée ;
// - sélection sans doublon, étalement déterministe.
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
    // Un cercle parfait donnerait des écarts identiques (dispersion nulle).
    expect(max - min).toBeGreaterThan(0.15);
    // L'espacement moyen reste gouverné par l'angle doré (répartition homogène).
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
    // Facteur mobile : amplitudes réduites.
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
    // Délais échelonnés : la cascade est progressive.
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
    // Étalement : le premier et le dernier de la liste sont couverts.
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
