import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fou IMP-06 — Storytelling accueil :
// - Marquee : composant serveur, 2 groupes identiques (1 aria-hidden),
//   conteneur overflow-hidden (anti-débordement E2E), animation CSS transform ;
// - CuratedCollections : composant serveur async, données réelles du snapshot
//   (isPopular + fallback), liens /produit/, aucune donnée inventée ;
// - StatsStrip : composant serveur async, chiffres DÉRIVÉS du catalogue ;
// - page.tsx : ordre Hero → Marquee → HP Looks → Sélection → Catégories → Stats,
//   page toujours serveur (ISR 60s), Hero toujours non enveloppé ;
// - reduced-motion reste la loi (acquis Phase 1, non négociable).
describe('Unit — IMP-06 Storytelling accueil', () => {
  it('page.tsx intègre Marquee après le Hero, puis Sélection et Stats (page serveur)', async () => {
    const page = await readFile('src/app/page.tsx', 'utf-8');
    expect(page).not.toContain("'use client'");
    expect(page).toContain('export const revalidate = 60;');
    expect(page).toContain('<Hero />');
    expect(page).toContain('<Marquee />');
    expect(page).toContain('<ScrollReveal><CuratedCollections /></ScrollReveal>');
    expect(page).toContain('<ScrollReveal><StatsStrip /></ScrollReveal>');
    const heroPos = page.indexOf('<Hero />');
    const marqueePos = page.indexOf('<Marquee />');
    const carouselPos = page.indexOf('<ScrollReveal><OutfitCarousel /></ScrollReveal>');
    const curatedPos = page.indexOf('<ScrollReveal><CuratedCollections /></ScrollReveal>');
    const gridPos = page.indexOf('<ScrollReveal><CategoryGrid /></ScrollReveal>');
    const statsPos = page.indexOf('<ScrollReveal><StatsStrip /></ScrollReveal>');
    expect(heroPos).toBeLessThan(marqueePos);
    expect(marqueePos).toBeLessThan(carouselPos);
    expect(carouselPos).toBeLessThan(curatedPos);
    expect(curatedPos).toBeLessThan(gridPos);
    expect(gridPos).toBeLessThan(statsPos);
  });

  it('Marquee : serveur, deux groupes identiques dont un aria-hidden, overflow-hidden', async () => {
    const marquee = await readFile('src/components/public/home/Marquee.tsx', 'utf-8');
    expect(marquee).not.toContain("'use client'");
    expect(marquee).toContain('overflow-hidden');
    expect(marquee).toContain('marquee-track');
    expect(marquee).toContain('<MarqueeGroup hidden={false} />');
    expect(marquee).toContain('<MarqueeGroup hidden />');
    expect(marquee).toContain('aria-hidden={hidden}');
  });

  it('globals.css définit la boucle marquee (transform -50%, pause hover, clippée)', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain('@keyframes marquee-scroll');
    expect(css).toContain('translate3d(-50%, 0, 0)');
    expect(css).toContain('.marquee-track');
    expect(css).toContain('animation-play-state: paused');
    expect(css).toContain('prefers-reduced-motion');
  });

  it('CuratedCollections : serveur async, isPopular réel + fallback, liens produit', async () => {
    const curated = await readFile('src/components/public/home/CuratedCollections.tsx', 'utf-8');
    expect(curated).not.toContain("'use client'");
    expect(curated).toContain('fetchServerCatalogSnapshot()');
    expect(curated).toContain('product.isPopular');
    expect(curated).toContain('products.slice(0, CURATED_COUNT)');
    expect(curated).toContain('if (curated.length === 0) return null;');
    expect(curated).toContain('href={`/produit/${product.id}`}');
    expect(curated).toContain('toLocaleString()} FCFA');
    expect(curated).toContain('skeleton-media');
  });

  it('StatsStrip : serveur async, chiffres dérivés du snapshot (rien d’inventé)', async () => {
    const stats = await readFile('src/components/public/home/StatsStrip.tsx', 'utf-8');
    expect(stats).not.toContain("'use client'");
    expect(stats).toContain('fetchServerCatalogSnapshot()');
    expect(stats).toContain('snapshot.outfits?.length');
    expect(stats).toContain('snapshot.products?.length');
    expect(stats).toContain('snapshot.categories?.length');
    expect(stats).toContain('Livraison express Cotonou');
  });

  it('les nouvelles cartes consomment les tokens motion IMP-01 (pas de durée en dur)', async () => {
    const curated = await readFile('src/components/public/home/CuratedCollections.tsx', 'utf-8');
    expect(curated).toContain('duration-(--motion-raise) ease-out-luxe');
    expect(curated).toContain('duration-(--motion-reveal) ease-out-expo');
    expect(curated).not.toMatch(/duration-\d/);
  });

  it('ScrollReveal enveloppe désormais 7 sections (garde-fou IMP-05 actualisé)', async () => {
    const sr = await readFile('tests/unit/scrollReveal.test.ts', 'utf-8');
    expect(sr).toContain('toBe(7)');
    const page = await readFile('src/app/page.tsx', 'utf-8');
    expect(page).not.toContain('<ScrollReveal><Hero /></ScrollReveal>');
    expect(page).not.toContain('<ScrollReveal><Marquee /></ScrollReveal>');
  });
});
