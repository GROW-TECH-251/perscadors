import { describe, it, expect } from 'vitest';
import { readFile, stat } from 'fs/promises';

// Garde-fous OV-1 — Fondation de l'intro HP Collection (aucune animation).
// (Reconstruits intégralement : le commit ebf2665 les avait perdus — fichiers
// de tests croisés pendant l'application du patch OV-2.)
//
// - Section in-flow sticky (scroll natif, pas de hijack), hauteurs
//   120 vh mobile / 150 vh desktop.
// - Gates pré-paint : script inline layout (session / reduced-motion /
//   Save-Data / ?intro=0|1) + règle CSS zero-JS pour reduced-motion.
// - Stage : logo dimensions fixées (0 CLS), lazy + fetchPriority (jamais
//   téléchargé si intro désactivée), auto-advance 2,2 s annulable (OV-3),
//   Échap = saut direct, marquage session au scroll-past.
// - Zéro librairie d'animation ; HTML serveur de la home inchangé ailleurs.
describe('Unit — OV-1 Intro : fondation sûre', () => {
  it('IntroSection : composant serveur, section sticky in-flow, hauteurs responsive', async () => {
    const s = await readFile('src/components/public/intro/IntroSection.tsx', 'utf-8');
    expect(s).not.toContain("'use client'");
    expect(s).toContain('id="pescador-intro"');
    expect(s).toContain('h-[120vh] lg:h-[150vh]');
    expect(s).toContain('sticky top-0');
    expect(s).toContain('bg-black');
    expect(s).toContain('aria-label="Introduction HP Collection"');
  });

  it('IntroStage : client, auto-advance 2,2 s annulable, webdriver guard, clé session', async () => {
    const s = await readFile('src/components/public/intro/IntroStage.tsx', 'utf-8');
    expect(s).toContain("'use client'");
    expect(s).toContain('const AUTO_ADVANCE_MS = 2_200;');
// OV-3d : AUCUN stockage persistant — la fin de séquence est marquée en
    // MÉMOIRE du document ; refresh et nouvel onglet rejouent l'intro.
    expect(s).toContain('__PESCADOR_INTRO_DONE__');
    expect(s).not.toContain('localStorage');
    expect(s).not.toContain('SEEN_KEY');
    expect(s).not.toContain('SEEN_TTL_MS');
    // Soft-navigation : re-check au montage (le gate pré-paint ne court qu'au
    // chargement du document) lisant le drapeau mémoire du document.
    expect(s).toContain('__PESCADOR_INTRO_DONE__ === 1');
    expect(s).toContain('navigator.webdriver');
    // Auto-advance = auto-scroll scripté CANCELABLE ; annulé au premier geste.
    expect(s).toContain("['wheel', 'touchmove', 'pointerdown']");
    // STATIC (reduced-motion) : ni auto-advance, ni boucle — positions finales.
    expect(s).toContain('!navigator.webdriver && !reduce');
    expect(s).toMatch(/positions finales pos\u00e9es UNE fois[\s\S]{0,900}opacity = '1';/);
    expect(s).toContain("if (event.key === 'Escape') skip(true);");
    // Skip utilisateur : collapse + scrollIntoView du bloc VISUEL suivant.
    expect(s).toContain('nextElementSibling');
    expect(s).toContain('scrollIntoView');
    // OV-3c : skip + indicateur de scroll fusionnés (chevron + « Passer »).
    expect(s).toContain('intro-cue-chevron');
    expect(s).toContain('<span>Passer</span>');
    expect(s).toContain('text-white/40');
    // Sortie naturelle : IntersectionObserver marque la session.
    expect(s).toContain('IntersectionObserver');
  });

  it('logo : dimensions fixées (0 CLS), lazy + fetchPriority, décoratif, identifié', async () => {
    const s = await readFile('src/components/public/intro/IntroStage.tsx', 'utf-8');
    expect(s).toContain('src="/assets/brand/hp-logo.webp"');
    expect(s).toContain('width={640}');
    expect(s).toContain('height={642}');
    expect(s).toContain('loading="lazy"');
    expect(s).toContain('fetchPriority="high"');
    expect(s).toContain('aria-hidden="true"');
    expect(s).toContain('data-intro-logo');
    // Seul élément focusable du stage : le bouton « Passer » (discret).
    expect(s).toContain('aria-label="Passer l\'introduction"');
  });

  it('layout : script inline des gates AVANT le rendu (data-conn, param)', async () => {
    const s = await readFile('src/app/layout.tsx', 'utf-8');
// OV-3d : le gate ne lit NI n'écrit aucun stockage — seuls Save-Data et
    // ?intro=0 coupent l'intro avant paint ; elle se rejoue sinon à chaque
    // chargement de document.
    expect(s).not.toContain('localStorage');
    expect(s).not.toContain('sessionStorage');
    expect(s).not.toContain('pescador-intro-at');
    expect(s).not.toContain('18e5');
    expect(s).toContain('saveData');
    expect(s).toContain('data-pescador-intro');

    // reduced-motion ne gate plus : intro STATIQUE (politique marque).
    expect(s).not.toContain("m=window.matchMedia");
    expect(s).toContain('navigator.connection&&navigator.connection.saveData');
    expect(s).toContain("q==='0'");
    // OV-3d : plus de gate de session — ?intro=1 est sans objet (ON est le
    // défaut) ; le script ne contient donc plus de branche q==='1'.
    expect(s).not.toContain("q==='1'");
    expect(s).toContain('data-pescador-intro');
    // Le script doit précéder les providers (premier enfant du body).
    expect(s.indexOf('dangerouslySetInnerHTML')).toBeLessThan(s.indexOf('<CatalogProvider>'));
  });

  it('globals.css : gates display:none (data-attr + reduced-motion zero-JS)', async () => {
    const s = await readFile('src/app/globals.css', 'utf-8');
    expect(s).toContain("html[data-pescador-intro='off'] .pescador-intro");
    // Politique reduced-motion = intro STATIQUE (plus de display:none).
    expect(s).not.toMatch(/prefers-reduced-motion[\s\S]{0,120}\.pescador-intro[\s\S]{0,60}display: none/);
  });

  it('page.tsx : IntroSection insérée une seule fois, en tête de home', async () => {
    const s = await readFile('src/app/page.tsx', 'utf-8');
    expect(s.match(/<IntroSection \/>/g)?.length).toBe(1);
    expect(s.indexOf('<IntroSection />')).toBeGreaterThan(s.indexOf('<DataHydrator'));
    expect(s.indexOf('<IntroSection />')).toBeLessThan(s.indexOf('<Hero'));
  });

  it('zéro librairie d’animation dans l’intro', async () => {
    const s = await readFile('src/components/public/intro/IntroStage.tsx', 'utf-8');
    const section = await readFile('src/components/public/intro/IntroSection.tsx', 'utf-8');
    const motion = await readFile('src/components/public/intro/introMotion.ts', 'utf-8');
    for (const banned of ['gsap', 'framer-motion', 'animejs', 'lenis', 'three']) {
      expect(s.toLowerCase()).not.toContain(banned);
      expect(section.toLowerCase()).not.toContain(banned);
      expect(motion.toLowerCase()).not.toContain(banned);
    }
  });

  it('asset logo : WebP léger (≤ 100 Ko) — budget premier écran', async () => {
    const info = await stat('public/assets/brand/hp-logo.webp');
    expect(info.size).toBeGreaterThan(10_000);
    expect(info.size).toBeLessThanOrEqual(100 * 1024);
  });

  it('OV-2 fix : plus aucun setState synchrone dans un effet (erreur VS Code)', async () => {
    const s = await readFile('src/components/public/intro/IntroStage.tsx', 'utf-8');
    expect(s).not.toContain('eslint-disable-next-line react-hooks/set-state-in-effect');
    // Gate pré-paint = simple early-return (zéro travail, zéro cascading render).
    expect(s).toMatch(/data-pescador-intro'\) === 'off'\) \{\s*[\r\n]+\s*return;/);
    // Le saut « Passer » ignore les siblings non visuels (script JSON-LD...).
    expect(s).toContain("['SCRIPT', 'NOSCRIPT', 'LINK', 'STYLE', 'TEMPLATE']");
  });
});
