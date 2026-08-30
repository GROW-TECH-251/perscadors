import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fou IMP-07 — Galerie produit (zoom / lightbox / swipe) :
// - lightbox : composant client autonome, SANS dépendance externe, accessible
//   (dialog + aria-modal + Escape/flèches), scroll body verrouillé/restauré ;
// - zoom au point de clic (transform-origin) avec suppression du clic post-swipe ;
// - swipe in-page sur l'image principale, distingué du tap (seuil 45px) ;
// - aucune logique panier/WhatsApp modifiée ;
// - durées 100% tokens (garde IMP-01/02 étendu à ces fichiers) ;
// - reduced-motion reste la loi (acquis Phase 1, non négociable).
describe('Unit — IMP-07 Galerie produit', () => {
  it('la lightbox existe, est cliente, sans dépendance d’animation externe', async () => {
    const lb = await readFile('src/components/public/ProductLightbox.tsx', 'utf-8');
    expect(lb).toContain("'use client'");
    expect(lb).not.toContain('framer-motion');
    expect(lb).not.toContain('gsap');
    expect(lb).not.toContain('animejs');
  });

  it('la lightbox est accessible : dialog, aria-modal, clavier, scroll-lock', async () => {
    const lb = await readFile('src/components/public/ProductLightbox.tsx', 'utf-8');
    expect(lb).toContain('role="dialog"');
    expect(lb).toContain('aria-modal="true"');
    expect(lb).toContain("event.key === 'Escape'");
    expect(lb).toContain("event.key === 'ArrowRight'");
    expect(lb).toContain("event.key === 'ArrowLeft'");
    expect(lb).toContain("document.body.style.overflow = 'hidden'");
    expect(lb).toContain('closeRef.current?.focus()');
  });

  it('zoom au point de clic + pas de zoom accidentel après un swipe', async () => {
    const lb = await readFile('src/components/public/ProductLightbox.tsx', 'utf-8');
    expect(lb).toContain('getBoundingClientRect()');
    expect(lb).toContain('setOrigin');
    expect(lb).toContain('transformOrigin: origin');
    expect(lb).toContain('swiped.current');
  });

  it('swipe lightbox et galerie in-page avec seuil et navigation circulaire', async () => {
    const lb = await readFile('src/components/public/ProductLightbox.tsx', 'utf-8');
    const page = await readFile('src/app/produit/[id]/product-detail-client.tsx', 'utf-8');
    expect(lb).toContain('SWIPE_THRESHOLD = 45');
    expect(page).toContain('Math.abs(delta) > 45');
    expect(page).toContain('handleGalleryPointerDown');
    expect(page).toContain('handleGalleryPointerUp');
    expect(page).toContain('openLightbox');
    expect(page).toContain('setLightboxIndex(videoActive ? videoIndex : selectedIndex)');
  });

  it('la galerie ouvre la lightbox au tap et affiche l’indication d’agrandissement', async () => {
    const page = await readFile('src/app/produit/[id]/product-detail-client.tsx', 'utf-8');
    expect(page).toContain('cursor-zoom-in');
    expect(page).toContain('Maximize2');
    expect(page).toContain('<ProductLightbox');
    expect(page).toContain('onClose={() => setLightboxIndex(null)}');
    expect(page).toContain('skeleton-media');
  });

  it('aucune régression fonctionnelle : panier, WhatsApp, sélecteurs intacts', async () => {
    const page = await readFile('src/app/produit/[id]/product-detail-client.tsx', 'utf-8');
    expect(page).toContain('handleAddToCart');
    expect(page).toContain('handleDealWhatsApp');
    expect(page).toContain('addToCart(product, selectedSize, selectedColor)');
    expect(page).toContain('openWhatsApp(message, settings.whatsapp_phone)');
  });

  it('globals.css définit l’entrée lightbox et le zoom sur tokens ; reduced-motion actif', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain('@keyframes lightbox-in');
    expect(css).toContain('.lightbox-fade-in');
    expect(css).toContain('.lightbox-zoom');
    expect(css).toContain('transition: transform var(--motion-smooth) var(--ease-out-expo)');
    expect(css).toContain('prefers-reduced-motion');
  });
});
