import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fou IMP-01 — Design tokens + motion + typographie fluide :
// - les easings / durées / échelle clamp() restent centralisés dans globals.css ;
// - le Hero consomme l'échelle fluide (text-hero) et les tokens motion ;
// - plus de courbe bezier codée en dur dans les composants publics migrés ;
// - prefers-reduced-motion reste la loi (acquis Phase 1, non négociable).
describe('Unit — IMP-01 Design tokens (motion & typographie fluide)', () => {
  it('globals.css définit les tokens easing et l’échelle typographique fluide', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain('--ease-out-expo');
    expect(css).toContain('--ease-out-luxe');
    expect(css).toContain('--text-hero: clamp(');
    expect(css).toContain('--text-display-lg: clamp(');
    expect(css).toContain('--text-display-md: clamp(');
  });

  it('globals.css définit les durées motion centralisées et le rythme de section', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    const tokens = ['--motion-micro', '--motion-fast', '--motion-smooth', '--motion-raise', '--motion-reveal', '--motion-entrance'];
    tokens.forEach((token) => expect(css).toContain(token));
    expect(css).toContain('--space-section');
  });

  it('le Hero utilise l’échelle fluide text-hero (plus de paliers fixes text-5xl/7xl/8xl)', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(hero).toContain('text-hero');
    expect(hero).not.toContain('text-5xl sm:text-7xl lg:text-8xl');
  });

  it('le Hero consomme les tokens motion (plus de bezier codé en dur)', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(hero).not.toContain('ease-[cubic-bezier');
    expect(hero).toContain('ease-out-luxe');
    expect(hero).toContain('duration-(--motion-smooth)');
  });

  it('les cards catégories consomment les tokens motion (raise/reveal)', async () => {
    const grid = await readFile('src/components/public/home/CategoryGrid.tsx', 'utf-8');
    expect(grid).toContain('ease-out-luxe');
    expect(grid).toContain('duration-(--motion-raise)');
    expect(grid).toContain('duration-(--motion-reveal)');
    expect(grid).not.toContain('ease-[cubic-bezier');
  });

  it('les valeurs motion de globals.css passent par les tokens (source unique)', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    // Les déclarations des règles motion doivent référencer les variables, pas des ms en dur.
    expect(css).toContain('animation: slide-up-fade var(--motion-entrance) var(--ease-out-expo) forwards');
    expect(css).toContain('transition: transform var(--motion-micro)');
    expect(css).toContain('transition: transform var(--motion-fast)');
  });

  it('prefers-reduced-motion reste présent (non-négociable)', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain('prefers-reduced-motion');
  });
});
