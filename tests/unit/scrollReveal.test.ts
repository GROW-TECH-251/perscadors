import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fou IMP-05 — Scroll reveal system :
// - le hook ne masque JAMAIS le contenu sans JS : reduced-motion (matchMedia)
//   et absence d'IntersectionObserver = dégradation totale, tout visible ;
// - l'état caché est posé par JS uniquement (HTML serveur intact → SEO) ;
// - observateur déconnecté après première révélation (perf) + cleanup ;
// - page.tsx reste un composant serveur, Hero non enveloppé (entrée IMP-04) ;
// - transitions sur tokens IMP-01 ; prefers-reduced-motion reste la loi.
describe('Unit — IMP-05 Scroll reveal system', () => {
  it('le hook respecte prefers-reduced-motion (aucun masquage si réduit)', async () => {
    const hook = await readFile('src/hooks/useScrollReveal.ts', 'utf-8');
    expect(hook).toContain("matchMedia('(prefers-reduced-motion: reduce)')");
    expect(hook).toContain('.matches');
    expect(hook).toContain('return;');
  });

  it('le hook dégrade proprement sans IntersectionObserver', async () => {
    const hook = await readFile('src/hooks/useScrollReveal.ts', 'utf-8');
    expect(hook).toContain("typeof IntersectionObserver === 'undefined'");
  });

  it('le hook pose l’état caché uniquement via JS et nettoie ses classes', async () => {
    const hook = await readFile('src/hooks/useScrollReveal.ts', 'utf-8');
    expect(hook).toContain("classList.add('reveal-hidden')");
    expect(hook).toContain("classList.add('reveal-visible')");
    expect(hook).toContain("classList.remove('reveal-hidden', 'reveal-visible')");
    expect(hook).toContain('observer.disconnect()');
  });

  it('page.tsx reste un composant serveur et n’embarque aucun état caché statique', async () => {
    const page = await readFile('src/app/page.tsx', 'utf-8');
    expect(page).not.toContain("'use client'");
    expect(page).not.toContain('reveal-hidden');
    expect(page).toContain('export const revalidate = 60;');
  });

  it('les 5 sections sont enveloppées par ScrollReveal, pas le Hero', async () => {
    const page = await readFile('src/app/page.tsx', 'utf-8');
    expect((page.match(/<ScrollReveal>/g) || []).length).toBe(5);
    expect(page).toContain('<ScrollReveal><OutfitCarousel /></ScrollReveal>');
    expect(page).toContain('<ScrollReveal><CategoryGrid /></ScrollReveal>');
    expect(page).toContain('<ScrollReveal><ArticleRequestSection /></ScrollReveal>');
    expect(page).toContain('<ScrollReveal><Testimonials /></ScrollReveal>');
    expect(page).toContain('<ScrollReveal><FAQ /></ScrollReveal>');
    expect(page).not.toContain('<ScrollReveal><Hero /></ScrollReveal>');
    expect(page).toContain('<Hero />');
  });

  it('globals.css définit la révélation sur les tokens motion (et reduced-motion global actif)', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain('.reveal-hidden');
    expect(css).toContain('.reveal-hidden.reveal-visible');
    expect(css).toContain('transition: opacity var(--motion-reveal) var(--ease-out-expo), transform var(--motion-reveal) var(--ease-out-expo)');
    expect(css).toContain('prefers-reduced-motion');
  });

  it('ScrollReveal est un composant client minimal qui rend ses enfants', async () => {
    const comp = await readFile('src/components/public/ScrollReveal.tsx', 'utf-8');
    expect(comp).toContain("'use client'");
    expect(comp).toContain('useScrollReveal<HTMLDivElement>()');
    expect(comp).toContain('data-reveal');
    expect(comp).toContain('{children}');
  });
});
