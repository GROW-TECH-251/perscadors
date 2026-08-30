import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fou IMP-02 — Micro-interactions & états :
// - plus aucune durée motion codée en dur dans les composants publics migrés
//   (Navbar incluse depuis IMP-03) ;
// - squelette de chargement média défini dans globals.css et posé derrière les
//   images des deux grilles publiques (catégories + HP Looks) ;
// - prefers-reduced-motion reste la loi (acquis Phase 1, non négociable).

// IMP-03 : Navbar.tsx ajoutée aux migrées (dernière exclue par IMP-02).
const MIGRATED = [
  // IMP-07 : fiche produit + lightbox ajoutées (durées toutes sur tokens).
  'src/app/produit/[id]/product-detail-client.tsx',
  'src/components/public/ProductLightbox.tsx',
  'src/components/public/layout/Navbar.tsx',
  'src/components/public/home/CategoryGrid.tsx',
  'src/components/public/home/OutfitCarousel.tsx',
  'src/components/public/home/FAQ.tsx',
  'src/components/public/home/ArticleRequestSection.tsx',
  'src/components/public/home/Hero.tsx',
  'src/components/public/layout/WhatsAppFloat.tsx',
];

describe('Unit — IMP-02 Micro-interactions & états', () => {
  it('aucune durée motion codée en dur dans les composants publics migrés', async () => {
    for (const file of MIGRATED) {
      const source = await readFile(file, 'utf-8');
      expect(source, `${file} contient une durée en dur`).not.toMatch(/duration-\d/);
      expect(source, `${file} contient une durée arbitraire`).not.toMatch(/duration-\[/);
      expect(source, `${file} contient un bezier en dur`).not.toContain('ease-[cubic-bezier');
    }
  });

  it('le squelette média est défini dans globals.css (animation opacity, token easing)', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain('.skeleton-media');
    expect(css).toContain('@keyframes skeleton-pulse');
    expect(css).toContain('animation: skeleton-pulse 1.6s var(--ease-out-expo) infinite');
  });

  it('les deux grilles publiques posent un squelette derrière leurs images', async () => {
    const grid = await readFile('src/components/public/home/CategoryGrid.tsx', 'utf-8');
    const carousel = await readFile('src/components/public/home/OutfitCarousel.tsx', 'utf-8');
    expect(grid).toContain('skeleton-media');
    expect(carousel).toContain('skeleton-media');
  });

  it('les composants migrés consomment les tokens motion IMP-01', async () => {
    const grid = await readFile('src/components/public/home/CategoryGrid.tsx', 'utf-8');
    const carousel = await readFile('src/components/public/home/OutfitCarousel.tsx', 'utf-8');
    expect(grid).toContain('duration-(--motion-raise)');
    expect(grid).toContain('duration-(--motion-fast)');
    expect(carousel).toContain('duration-(--motion-reveal)');
    expect(carousel).toContain('duration-(--motion-fast)');
  });

  it('prefers-reduced-motion reste présent (non-négociable)', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain('prefers-reduced-motion');
  });
});
