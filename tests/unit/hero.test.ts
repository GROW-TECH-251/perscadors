import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fou contre la régression "Hero vidéo mobile" :
// - plus de soustraction arbitraire du header (calc(100svh-80px)) ni de
//   plancher en pixels (min-h-[560px] / sm:min-h-[700px]) ;
// - hauteur en unités viewport (100vh / 100svh) ;
// - object-fit par orientation : cover en mobile, contain en desktop ;
// - une seule vidéo décodée sur mobile (fond flou réservé au desktop).
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

  it('le fond flou doit être réservé au desktop (hidden lg:block)', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(hero).toContain('hidden');
    expect(hero).toContain('lg:block');
  });

  it('le skeleton de chargement doit utiliser la même hauteur que le Hero', async () => {
    const loading = await readFile('src/app/loading.tsx', 'utf-8');
    expect(loading).toContain('perscadors-hero');
    expect(loading).not.toContain('calc(100vh-80px)');
    expect(loading).not.toContain('min-h-[560px]');
  });
});
