import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Lot 2 (mission HP Look 09/2026) — la LookModal doit être rendue en portail
// sous document.body : le carrousel home est enveloppé par ScrollReveal dont
// le transform (translate3d) reste actif après révélation, et tout ancêtre
// transformé devient le bloc d'ancrage des position:fixed — la modale se
// positionnait par rapport à la boîte de la section (coupée/hors écran selon
// la position de la grille et le scroll) au lieu du viewport.
// Preuve comportementale : tests/e2e/hp-inspection.spec.ts, describe
// « Lot 2 — modale ancrée au viewport (portail) » (grille alignée en haut,
// scroll profond, panneau entièrement dans le viewport, Escape).

describe('Unit — Lot 2 : LookModal rendue en portail (ancrage viewport)', () => {
  it('rendue via createPortal sous document.body', async () => {
    const source = await readFile('src/components/public/LookModal.tsx', 'utf-8');
    expect(source).toContain("import { createPortal } from 'react-dom'");
    expect(source).toMatch(/return createPortal\(/);
    expect(source).toMatch(/document\.body\s*\n?\s*\);/);
  });

  it('garde SSR : aucun rendu serveur de la modale (montée uniquement après un clic)', async () => {
    const source = await readFile('src/components/public/LookModal.tsx', 'utf-8');
    expect(source).toContain("if (typeof document === 'undefined') return null;");
  });

  it('comportements a11y préservés (Escape, piège de focus, scroll-lock, dialog modal)', async () => {
    const source = await readFile('src/components/public/LookModal.tsx', 'utf-8');
    expect(source).toContain("event.key === 'Escape'");
    expect(source).toContain('FOCUSABLE_SELECTOR');
    expect(source).toContain("document.body.style.overflow = 'hidden'");
    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
  });

  it('contexte du bug documenté : ScrollReveal (ancêtre transformé) enveloppe toujours le carrousel', async () => {
    const home = await readFile('src/app/page.tsx', 'utf-8');
    const carousel = await readFile('src/components/public/home/OutfitCarousel.tsx', 'utf-8');
    // Le portail neutralise le problème SANS toucher au système de révélation
    // (IMP-05) : l'enveloppe ScrollReveal reste en place.
    expect(home).toContain('<ScrollReveal><OutfitCarousel /></ScrollReveal>');
    expect(carousel).toContain('<LookModal');
  });
});
