import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fou contre la régression "Hero vidéo mobile" :
// - plus de soustraction arbitraire du header (calc(100svh-80px)) ni de
//   plancher en pixels (min-h-[560px] / sm:min-h-[700px]) ;
// - hauteur en unités viewport (100vh / 100svh) ;
// - object-fit par orientation : cover en mobile, contain en desktop ;
// - IMP-04 : une seule vidéo (poster flou en letterbox), fallback poster net, stagger + scroll cue.
describe('Unit — Hero (hauteur & vidéo responsive)', () => {
  it('le Hero ne doit plus soustraire 80px ni imposer de plancher en pixels', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(hero).not.toContain('calc(100vh-80px)');
    expect(hero).not.toContain('calc(100svh-80px)');
    expect(hero).not.toContain('min-h-[560px]');
    expect(hero).not.toContain('min-h-[700px]');
  });

  it('le Hero doit utiliser la classe à hauteur viewport', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(hero).toContain('perscadors-hero');
  });

  it('la hauteur du hero doit être définie en 100vh puis 100svh (sans px)', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain('height: 100vh');
    expect(css).toContain('height: 100svh');
  });

  it('le Hero doit appliquer cover en mobile et contain en desktop', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(hero).toContain('object-cover lg:object-contain');
  });

  it('IMP-04 : une seule vidéo décodée, avec poster (fin du double décodage)', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    const videoTags = hero.match(/<video/g) || [];
    expect(videoTags.length).toBe(1);
    expect(hero).toContain('poster={DEFAULT_HERO_POSTER}');
    // Le letterbox desktop est comblé par une image floutée, pas une 2e vidéo.
    expect(hero).toContain('blur-lg lg:blur-xl');
  });

  it('IMP-04 : plus jamais d écran vide — onError bascule sur le poster net', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(hero).not.toContain("setMediaUrl('')");
    expect(hero).toContain('setVideoFailed(true)');
    expect(hero).toContain('videoFailed');
  });

  it('IMP-04 : entrée staggered (titre → sous-titre → CTA)', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(hero).toContain('animate-slide-up-fade stagger-1');
    expect(hero).toContain('animate-slide-up-fade stagger-2');
    expect(hero).toContain('animate-slide-up-fade stagger-3');
  });

  it('IMP-04 : indicateur de scroll discret vers les outfits', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(hero).toContain('animate-scroll-cue');
    expect(hero).toContain('href="#carousel-outfits"');
    expect(hero).toContain('aria-label="Découvrir les outfits Vioutou"');
  });

  it('IMP-04 : globals.css définit surcharges stagger + flottement du cue', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain('.animate-slide-up-fade.stagger-1');
    expect(css).toContain('.animate-slide-up-fade.stagger-2');
    expect(css).toContain('.animate-slide-up-fade.stagger-3');
    expect(css).toContain('@keyframes scroll-cue-float');
    expect(css).toContain('.animate-scroll-cue');
    // Le delay de base (utilisé par l'admin) ne doit pas avoir changé.
    expect(css).toContain('animation-delay: 0.2s;');
  });
  it('le skeleton de chargement doit utiliser la même hauteur que le Hero', async () => {
    const loading = await readFile('src/app/loading.tsx', 'utf-8');
    expect(loading).toContain('perscadors-hero');
    expect(loading).not.toContain('calc(100vh-80px)');
    expect(loading).not.toContain('min-h-[560px]');
  });
});
