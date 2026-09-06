import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import path from 'path';

// Garde-fou contre la régression "HP Loop" : l'ancienne animation CSS
// translate3d(-50%) exigeait un contenu dupliqué. Le carrousel ne rend plus
// qu'une seule copie des outfits, donc l'auto-scroll doit être piloté en
// JavaScript (requestAnimationFrame + scrollLeft), sans animation CSS -50%.
describe('Unit — OutfitCarousel (régression HP Loop)', () => {
  it('le CSS ne doit plus appliquer d animation scroll-carousel translate3d(-50%)', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).not.toContain('animation: scroll-carousel');
    // Le carrousel HP Looks ne doit avoir AUCUNE animation de défilement CSS :
    // sa piste (.outfit-carousel-track) est scrollée en JS (auto-scroll IMP-02/Phase 1).
    // NB IMP-06 : translate3d(-50%) reste autorisé ailleurs (marquee éditorial,
    // conteneur .marquee-track distinct, clippé overflow-hidden).
    expect(css).not.toMatch(/\.outfit-carousel-track\s*\{[^}]*animation/s);
  });

  it('le composant doit piloter l auto-scroll en JavaScript', async () => {
    const component = await readFile('src/components/public/home/OutfitCarousel.tsx', 'utf-8');
    expect(component).toContain('requestAnimationFrame');
    expect(component).toContain('scrollLeft');
    expect(component).not.toContain('animationPlayState');
  });
});

describe('Unit — E1 OutfitCarousel : le clic doit atteindre la carte', () => {
  it('handlePointerDown ne capture plus le pointeur (sinon le click est détourné)', async () => {
    const src = await readFile(path.resolve('src/components/public/home/OutfitCarousel.tsx'), 'utf-8');
    const pointerDown = src.slice(
      src.indexOf('const handlePointerDown'),
      src.indexOf('const handlePointerMove'),
    );
    // l'APPEL doit avoir disparu (le mot figure dans le commentaire explicatif).
    expect(pointerDown).not.toMatch(/\.setPointerCapture\(/);
    expect(pointerDown).toContain('NE PAS setPointerCapture');
  });

  it('la capture est différée à un vrai drag, au-delà du seuil', async () => {
    const src = await readFile(path.resolve('src/components/public/home/OutfitCarousel.tsx'), 'utf-8');
    const pointerMove = src.slice(
      src.indexOf('const handlePointerMove'),
      src.indexOf('const handlePointerUp'),
    );
    expect(pointerMove).toContain('DRAG_CAPTURE_THRESHOLD_PX');
    expect(pointerMove).toContain('setPointerCapture');
  });

  it('le seuil de drag existe et reste petit (clic != drag)', async () => {
    const src = await readFile(path.resolve('src/components/public/home/OutfitCarousel.tsx'), 'utf-8');
    const m = src.match(/DRAG_CAPTURE_THRESHOLD_PX = (\d+)/);
    expect(m).not.toBeNull();
    expect(Number(m![1])).toBeGreaterThan(0);
    expect(Number(m![1])).toBeLessThanOrEqual(10);
  });
});
