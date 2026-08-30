import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

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
