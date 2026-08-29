import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fou IMP-03 — Navbar premium :
// - verre progressif au scroll (blur-sm au repos, blur-lg au scroll) sur tokens ;
// - lien actif = soulignement animé (nav-link / nav-link--active), plus de border-b statique ;
// - menu mobile animé (animate-nav-panel) + aria-expanded sur le bouton ;
// - zéro durée motion codée en dur (achève la migration IMP-01/02) ;
// - prefers-reduced-motion reste la loi (acquis Phase 1, non négociable).
describe('Unit — IMP-03 Navbar premium', () => {
  it('la Navbar utilise le verre progressif et les tokens motion (pas de durée en dur)', async () => {
    const nav = await readFile('src/components/public/layout/Navbar.tsx', 'utf-8');
    expect(nav).toContain('backdrop-blur-sm');
    expect(nav).toContain('backdrop-blur-lg');
    expect(nav).toContain('duration-(--motion-smooth)');
    expect(nav).not.toMatch(/duration-\d/);
    expect(nav).not.toMatch(/duration-\[/);
    expect(nav).not.toContain('ease-[cubic-bezier');
  });

  it('les liens desktop utilisent le soulignement animé (plus de border-b statique)', async () => {
    const nav = await readFile('src/components/public/layout/Navbar.tsx', 'utf-8');
    expect(nav).toContain('nav-link font-bebas');
    expect(nav).toContain("nav-link--active text-brand-gold");
    expect(nav).not.toContain("'text-brand-gold border-b border-brand-gold'");
  });

  it('le bouton hamburger expose aria-expanded', async () => {
    const nav = await readFile('src/components/public/layout/Navbar.tsx', 'utf-8');
    expect(nav).toContain('aria-expanded={isMobileMenuOpen}');
  });

  it('le panneau mobile est animé et ferme toujours au clic sur un lien', async () => {
    const nav = await readFile('src/components/public/layout/Navbar.tsx', 'utf-8');
    expect(nav).toContain('animate-nav-panel');
    expect(nav).toContain('onClick={() => setIsMobileMenuOpen(false)}');
  });

  it('globals.css définit nav-link (::after sur tokens), le panneau animé et blur-lg', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain('.nav-link::after');
    expect(css).toContain('transition: transform var(--motion-fast) var(--ease-out-luxe)');
    expect(css).toContain('.nav-link--active::after');
    expect(css).toContain('@keyframes nav-panel-in');
    expect(css).toContain('.animate-nav-panel');
    expect(css).toContain('.backdrop-blur-lg');
  });

  it('la cascade du menu mobile reste bornée (6 liens max) et sur transform/opacity', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain('.animate-nav-panel > *:nth-child(6)');
    expect(css).not.toContain('.animate-nav-panel > *:nth-child(7)');
  });

  it('prefers-reduced-motion reste présent (non-négociable)', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain('prefers-reduced-motion');
  });
});
