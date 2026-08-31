// src/components/public/intro/IntroSection.tsx
// OV-1 — Fondation de la séquence d'introduction HP Collection.
//
// Section IN-FLOW « sticky » : le scroll reste 100 % natif (aucun hijack,
// aucun smooth-scroll artificiel) — la hauteur (120 vh mobile / 150 vh
// desktop) DEViendra la timeline de convergence en OV-3.
//
// OV-1 = AUCUNE animation : logo statique + « Passer l'introduction » +
// auto-dismiss 2,5 s (voir IntroStage).
//
// Gates pré-paint (script inline du layout + globals.css) : session déjà
// vue / prefers-reduced-motion / Save-Data / ?intro=0 -> la section est
// display:none AVANT le premier rendu -> 0 flash, 0 CLS, 0 image chargée.
//
// SEO : contenu réel de la home inchangé ; cette section est décorative
// (champ aria-hidden, un seul élément focusable : le bouton « Passer »).
// Composant SERVEUR : zéro JS ajouté tant qu'IntroStage n'hydrate pas.
import { IntroStage } from './IntroStage';
export function IntroSection() {
  return (
    <section
      id="pescador-intro"
      aria-label="Introduction HP Collection"
      className="pescador-intro relative h-[120vh] lg:h-[150vh] bg-black"
    >
      <div className="sticky top-0 flex h-screen flex-col items-center justify-center overflow-hidden">
        <IntroStage />
      </div>
    </section>
  );
}
