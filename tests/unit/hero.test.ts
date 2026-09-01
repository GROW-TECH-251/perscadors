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

  it('OV-4 : la vidéo ne se charge qu à l apparition réelle du hero (IO, une seule variante)', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    // Le HTML servi ne doit contenir aucun src vidéo : la balise ne monte
    // qu'au client, à l'intersection (zéro octet pendant l'intro, fini le
    // double téléchargement mobile 1080p+720p).
    expect(hero).toContain('{heroVisible && (');
    expect(hero).toContain("new IntersectionObserver");
    expect(hero).toContain("rootMargin: '200px'");
    // Le poster, lui, reste rendu immédiatement (PERF-01 intact).
    expect(hero).toContain('priority');
    expect(hero).toContain('preload="auto"');
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

  // PERF-01 — Architecture de chargement Hero : rendu immédiat, variantes
  // allégées, démarrage parallèle, fondu poster->vidéo.
  it('PERF-01 : aucun état vide — poster + vidéo par défaut au premier rendu', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(hero).not.toContain("useState<string>('')");
    expect(hero).toContain('useState<string>(resolveDefaultHeroVideo)');
    expect(hero).toContain('HERO_VIDEO_1080P');
    expect(hero).toContain('HERO_VIDEO_720P');
    expect(hero).toContain("window.matchMedia('(max-width: 767px)')");
  });

  it('PERF-01 : la 4K legacy (36 Mo) est mappée vers la variante allégée', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(hero).toContain('LEGACY_HERO_VIDEO_4K');
    expect(hero).toContain('mapLegacyHeroVideo');
    const settings = await readFile('src/services/settingsService.ts', 'utf-8');
    expect(settings).toContain("hero_video_url: '/assets/backgrounds/hero-1080p.mp4'");
  });

  it('PERF-01 : fondu poster->vidéo à canplay + préchargement immédiat', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(hero).toContain('onCanPlay={() => setVideoReady(true)}');
    expect(hero).toContain("videoReady ? 'opacity-90' : 'opacity-0'");
    expect(hero).toContain('preload="auto"');
    expect(hero).not.toContain('preload="metadata"');
    // Un canplay survenu avant l'hydratation doit quand même déclencher le fondu.
    expect(hero).toContain('element.readyState >= 3');
  });

  it('PERF-01 : pas de re-téléchargement quand les données confirment les défauts', async () => {
    const hero = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(hero).toContain('current === nextUrl ? current : nextUrl');
    // src en attribut direct : un changement de mediaUrl recharge nativement
    // la vidéo (un <source> patché à l'hydratation ne redémarre PAS le chargement).
    expect(hero).toContain('src={mediaUrl}');
    expect(hero).not.toContain('<source src={mediaUrl}');
  });
});
