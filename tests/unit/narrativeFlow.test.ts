import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// DERNIÈRE IMPLÉMENTATION — Narration Intro → Hero → Header.
// Garde-fous du mécanisme :
// - la navbar (et la bulle WhatsApp) sont invisibles AVANT hydratation
//   tant que la séquence intro n'est pas consommée (règle :has, home
//   uniquement, zéro flash/zéro CLS) ;
// - le runtime Navbar décide seul ensuite via la position RÉELLE du hero
//   (bottom > 0) — aucune timer, aucune hauteur codée en dur ;
// - les pages sans séquence narrative gardent la navbar sticky standard.

describe('Unit — Dernière implémentation : navbar / hero / narration', () => {
  it('pré-paint CSS : navbar hors flux + invisible tant que l’intro n’est pas consommée (home via :has)', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain("body:has(#pescador-intro:not([data-intro-done])) .pescador-navbar");
    expect(css).toContain('transform: translateY(-100%);');
    expect(css).toContain('pointer-events: none;');
    // La bulle WhatsApp — élément commercial flottant — disparaît aussi
    // pendant l'ouverture.
    expect(css).toContain("body:has(#pescador-intro:not([data-intro-done])) .pescador-whatsapp-float");
    expect(css).toContain('opacity: 0;');
  });

  it('Navbar : mode narratif piloté par la position réelle du hero (aucun timer)', async () => {
    const nav = await readFile('src/components/public/layout/Navbar.tsx', 'utf-8');
    expect(nav).toContain('pescador-navbar');
    // Overlay fixe sur la home, sticky standard partout ailleurs.
    expect(nav).toContain("heroOverlay ? 'fixed' : 'sticky'");
    // LA règle déterministe : caché tant que le hero est à l'écran —
    // ce qui couvre aussi toute la phase intro (hero sous le viewport).
    expect(nav).toContain('hero.getBoundingClientRect().bottom > 0');
    // Évaluation au rAF + listener passif, jamais de timer.
    expect(nav).toContain('requestAnimationFrame(update)');
    expect(nav).toContain("{ passive: true }");
    // Le mécanisme narratif n'a AUCUN timer (le setTimeout préexistant
    // du chargement des réglages est hors de ce mécanisme).
    expect(nav).not.toContain('setInterval');
    expect(nav).not.toContain('setTimeout(update)');
    expect(nav).not.toContain('setTimeout(() => setNarrativeHidden');
    // Focus impossible sur une navigation invisible.
    expect(nav).toContain('inert={heroOverlay && narrativeHidden ? true : undefined}');
  });

  it('Hero : identifiant de mesure pour la navbar', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(hero).toContain('id="pescador-hero"');
  });

  it('IntroStage : la séquence consommée libère le mode narratif (markSeen, off, soft-nav)', async () => {
    const stage = await readFile('src/components/public/intro/IntroStage.tsx', 'utf-8');
    expect(stage.match(/setAttribute\('data-intro-done', '1'\)/g)?.length).toBe(3);
  });

  it('WhatsAppFloat : porte la classe du hook CSS', async () => {
    const wa = await readFile('src/components/public/layout/WhatsAppFloat.tsx', 'utf-8');
    expect(wa).toContain('pescador-whatsapp-float');
  });
});
