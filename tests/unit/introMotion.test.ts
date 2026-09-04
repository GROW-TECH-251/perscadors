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
  breathScale,
  buildOrbitSeed,
  clamp01,
  computePlacement,
  logoSafeBox,
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
  rotationCounter,
  scrollProgress,
  slotFade,
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
      // Bornes anisotropes OV-3f : x ≤ r·1,18·min, y ≤ r·0,74·min (paysage
      // étalé pleine largeur, bleed horizontal léger) — ÉLARGIES par la safe
      // zone logo (finalisation 09/2026) : un point repoussé au bord du rect
      // protégé peut dépasser l'ellipse d'origine, jamais les deux bords.
      const box = logoSafeBox(1280, 720);
      // + marge de dérive (ampMax coque + parallaxe) : le clamp dilate le bord.
      const marge = INTRO_SHELLS[seed.depth].driftAmpMax + 10;
      expect(Math.abs(x)).toBeLessThanOrEqual(Math.max(seed.radiusRatio * 720 * 1.18, box.halfWidth + marge) + 1);
      expect(Math.abs(y)).toBeLessThanOrEqual(Math.max(seed.radiusRatio * 720 * 0.74, box.halfHeight + box.bottomExtra + marge) + 1);
    }
    expect(maxX).toBeGreaterThan(maxY); // champ étalé horizontalement
    // Portrait : axe x comprimé (×0.88) — lisibilité préservée sur mobile.
    const portrait = computePlacement(seeds[0], 390, 844);
    const boxM = logoSafeBox(390, 844);
    expect(Math.abs(portrait.x)).toBeLessThanOrEqual(Math.max(seeds[0].radiusRatio * 390 * 0.88, boxM.halfWidth + INTRO_SHELLS[seeds[0].depth].driftAmpMax + 10) + 1);
  });

  it('finalisation 09/2026 — SAFE ZONE : aucun centre de vignette dans le rect du logo (desktop + mobile)', () => {
    for (const viewport of [[1280, 720], [1440, 900], [390, 844], [375, 812]]) {
      const [w, h] = viewport;
      const box = logoSafeBox(w, h);
      for (const prefix of ['a', 'zz', 'k9', 'final']) {
        const seedsN = Array.from({ length: 9 }, (_, i) => buildOrbitSeed(`${prefix}${i}`, i));
        for (const seed of seedsN) {
          const { x, y } = computePlacement(seed, w, h);
          const inside = x > -box.halfWidth && x < box.halfWidth && y > -box.halfHeight && y < box.halfHeight + box.bottomExtra;
          expect(inside).toBe(false);
        }
      }
    }
  });

  it('finalisation 09/2026 — MOBILE : les 4 côtés autour du logo sont exploités (pas de concentration bas-gauche)', () => {
    const seedsM = Array.from({ length: 6 }, (_, i) => buildOrbitSeed(`m${i}`, i));
    let left = 0, right = 0, top = 0, bottom = 0;
    for (const seed of seedsM) {
      const { x, y } = computePlacement(seed, 390, 844);
      if (x < 0) left += 1; else right += 1;
      if (y < 0) top += 1; else bottom += 1;
    }
    expect(left).toBeGreaterThan(0);
    expect(right).toBeGreaterThan(0);
    expect(top).toBeGreaterThan(0);
    expect(bottom).toBeGreaterThan(0);
  });

  it('OV-3c-2 ÉQUILIBRE : le champ ne bascule jamais d’un côté (régression photo user)', () => {
    // Constat utilisateur (photo) : avec la coque tirée par HASH, 2-3
    // grandes vignettes atterrissaient dans le même quadrant -> tout le
    // champ visuel s'empilait d'un côté. La stratification SHELL_PATTERN
    // place chaque coque à des angles opposés : le centroïde des 8
    // placements reste proche du centre POUR TOUT HASH (mesuré 2-11 % du
    // rayon max ; l'ancien code donnait ~20 %+ vers un seul quadrant).
    const TAU = Math.PI * 2;
    // Véritable distance circulaire (mod 2π, symétrique) — une version
    // mod π confondrait « 170° d'écart » et « 10° d'écart ».
    const circDist = (a: number, b: number) => {
      const d = Math.abs(((a - b) % TAU + TAU) % TAU);
      return Math.min(d, TAU - d);
    };
    for (const prefix of ['a', 'pop', 'zz', 'k9']) {
      // OV-3f : 9 slots (pattern 2 lointaines / 4 médianes / 3 proches).
      const seeds8 = Array.from({ length: 9 }, (_, i) => buildOrbitSeed(`${prefix}${i}`, i));
      expect(seeds8.filter((s) => s.depth === 0)).toHaveLength(2);
      expect(seeds8.filter((s) => s.depth === 1)).toHaveLength(4);
      expect(seeds8.filter((s) => s.depth === 2)).toHaveLength(3);
      // Préfixe mobile (6 visibles) : 1/3/2 — équilibré aussi.
      const mobile = seeds8.slice(0, 6);
      expect(mobile.filter((s) => s.depth === 0)).toHaveLength(1);
      expect(mobile.filter((s) => s.depth === 1)).toHaveLength(3);
      expect(mobile.filter((s) => s.depth === 2)).toHaveLength(2);
      let sx = 0;
      let sy = 0;
      let maxR = 0;
      for (const seed of seeds8) {
        const { x, y } = computePlacement(seed, 1280, 720);
        sx += x;
        sy += y;
        maxR = Math.max(maxR, seed.radiusRatio);
      }
      const deviation = Math.hypot(sx / 9, sy / 9) / (maxR * 720);
      // ≤ 20 % du rayon externe = ≤ ~14 % de la demi-largeur écran
      // (la régression historique était > 100 % : tout d’un côté).
      expect(deviation).toBeLessThan(0.2);
      // Far (2 membres) : opposition garantie. Mid/near (4 et 3 membres) :
      // aucune ne laisse un demi-cercle vide (> 3,6 rad ~ 206°).
      const farAngles = seeds8.filter((s) => s.depth === 0).map((s) => s.angle);
      expect(circDist(farAngles[0], farAngles[1])).toBeGreaterThan(2.3);
      for (const depth of [1, 2] as const) {
        const angles = seeds8
          .filter((sd) => sd.depth === depth)
          .map((sd) => sd.angle)
          .map((a) => ((a % TAU) + TAU) % TAU)
          .sort((a, b) => a - b);
        let maxGap = 0;
        for (let i = 0; i < angles.length; i += 1) {
          const next = i === angles.length - 1 ? angles[0] + TAU : angles[i + 1];
          maxGap = Math.max(maxGap, next - angles[i]);
        }
        // ≤ 3,9 rad (223°) : interdit le regroupement dans un quadrant
        // (serait ≥ 4,7 rad) tout en tolérant le jitter angulaire.
        expect(maxGap).toBeLessThan(3.9);
      }
    }
  });

  it('OV-3e RESPIRATION : dérive riche mais bornée, échelle vivante subtile (pas de révolution)', () => {
    const population = Array.from({ length: 24 }, (_, i) => buildOrbitSeed(`br${i}`, i));
    for (const seed of population) {
      expect(seed.breathAmp).toBeGreaterThanOrEqual(0.012);
      expect(seed.breathAmp).toBeLessThanOrEqual(0.04);
      expect(seed.breathPeriodMs).toBeGreaterThanOrEqual(7_000);
      expect(seed.breathPeriodMs).toBeLessThanOrEqual(12_000);
      for (let t = 0; t < 30_000; t += 997) {
        const breath = breathScale(seed, t);
        expect(breath).toBeGreaterThanOrEqual(1 - seed.breathAmp - 1e-9);
        expect(breath).toBeLessThanOrEqual(1 + seed.breathAmp + 1e-9);
      }
      for (let t = 0; t < 30_000; t += 877) {
        const { x, y } = driftOffset(seed, t);
        expect(Math.abs(x)).toBeLessThanOrEqual(seed.ampX + 1e-9);
        expect(Math.abs(y)).toBeLessThanOrEqual(seed.ampY + 1e-9);
      }
      expect(seed.ampX).toBeGreaterThanOrEqual(6);
    }

    // Position angulaire FIXE : le placement ne dépend PAS du temps (pas de
    // rotation circulaire — ne pas réintroduire un paramètre temporel).
    const seed = population[3];
    expect(computePlacement(seed, 1280, 720)).toEqual(computePlacement(seed, 1280, 720));
  });

  it('OV-3f ROTATION : compteur round-robin et fondus bornés (micro-animation interne)', () => {
    // Compteur : monotone, nul avant le premier intervalle.
    expect(rotationCounter(0)).toBe(0);
    expect(rotationCounter(5_199)).toBe(0);
    expect(rotationCounter(5_200)).toBe(1);
    expect(rotationCounter(10_400)).toBe(2);
    expect(rotationCounter(10_399)).toBe(1);
    // Fondus : idle = 1 ; sortie 550 ms décroissante ; entrée 700 ms
    // croissante ; bornes exactes 0/1 ; finie = 0 ou 1 franc.
    expect(slotFade('idle', 0, 12_345)).toBe(1);
    expect(slotFade('out', 1_000, 1_000)).toBe(1);
    expect(slotFade('out', 1_000, 1_000 + 275)).toBeGreaterThan(0.4);
    expect(slotFade('out', 1_000, 1_000 + 275)).toBeLessThan(0.6);
    expect(slotFade('out', 1_000, 1_000 + 550)).toBe(0);
    expect(slotFade('in', 2_000, 2_000)).toBe(0);
    expect(slotFade('in', 2_000, 2_000 + 350)).toBeGreaterThan(0.4);
    expect(slotFade('in', 2_000, 2_000 + 350)).toBeLessThan(0.6);
    expect(slotFade('in', 2_000, 2_000 + 700)).toBe(1);
  });

  it('OV-3c GRAVITATION : les vignettes proches frôlent la zone du logo', () => {
    const near = seeds.filter((s) => s.depth === 2);
    for (const seed of near) {
      const { x, y } = computePlacement(seed, 1280, 720);
      expect(Math.hypot(x, y)).toBeLessThanOrEqual(0.38 * 720 * 1.18 + 1);
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

  it('convergeTarget : halo resserré DERRIÈRE le LOGO RÉEL, le long du rayon d’origine', () => {
    // Finalisation 09/2026 — le halo entoure le CENTRE MESURÉ du monogramme
    // (logoOffset), biaisé vers sa zone basse/interne : plus jamais le centre
    // géométrique du viewport (zone noire sous le logo).
    const logoOffset = { x: 4, y: -24 };
    const box = logoSafeBox(1200, 800);
    const cy = logoOffset.y + box.halfHeight * 0.35;
    for (const seed of seeds) {
      const { x, y } = convergeTarget(seed, 1200, 800, logoOffset);
      const dist = Math.hypot(x - logoOffset.x, y - cy);
      expect(dist).toBeGreaterThanOrEqual(WATERMARK_TARGET_MIN * 800 - 1);
      expect(dist).toBeLessThanOrEqual(WATERMARK_TARGET_MAX * 800 + 1);
      expect(Math.sign(x - logoOffset.x)).toBe(Math.sign(Math.cos(seed.angle)));
      expect(Math.sign(y - cy)).toBe(Math.sign(Math.sin(seed.angle)));
    }
    // La cible reste dans la zone visuelle du logo (± demi-hauteur + halo).
    expect(cy).toBeGreaterThan(0);
    expect(cy).toBeLessThan(box.halfHeight + box.bottomExtra);
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

// Finalisation 09/2026 — garantie ABSOLUE : même à la dérive Lissajous max
// (+ parallaxe pire cas), le centre d'une vignette clampée ne re-traverse
// jamais la safe zone (mesuré en sonde : jusqu'à 28 px de re-entrée).
describe('Safe zone : marge de dérive (finalisation)', () => {
  it('place + dérive max + parallaxe reste hors de la zone logo (9 slots, 2 viewports)', () => {
    for (const [width, height] of [[1280, 720], [390, 844]] as const) {
      const box = logoSafeBox(width, height);
      for (let i = 0; i < 9; i += 1) {
        const seed = buildOrbitSeed(`drift-guard-${i}`, i);
        const place = computePlacement(seed, width, height);
        // Pire cas : balayer t pour capter le max de chaque sinus de dérive.
        for (let t = 0; t <= 12000; t += 250) {
          const d = driftOffset(seed, t, 1); // facteur 1 = desktop (pire)
          const cx = place.x + d.x + 10; // + parallaxe pire cas
          const cy = place.y + d.y + 10;
          const inside = cx > -box.halfWidth && cx < box.halfWidth && cy > -box.halfHeight && cy < box.halfHeight + box.bottomExtra;
          expect(inside, `slot ${i} ${width}x${height} t=${t} (${cx.toFixed(0)},${cy.toFixed(0)})`).toBe(false);
        }
      }
    }
  });
});
