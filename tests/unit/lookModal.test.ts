import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fou IMP-09 — Modal Look premium :
// - composant autonome, zéro dépendance d'animation ;
// - accessibilité complète : dialog, aria-modal, Escape, piège Tab,
//   focus initial/restitué, scroll body verrouillé puis restauré ;
// - pièces cliquables vers les fiches produit (fermeture avant navigation) ;
// - feedback d'ajout panier (« ✓ ajouté ») puis fermeture automatique ;
// - relais WhatsApp identique à la page /looks ;
// - le carousel délègue au composant partagé, logique panier intacte ;
// - animations 100 % tokens IMP-01.
describe('Unit — IMP-09 Modal Look', () => {
  it('le composant existe, est client et sans dépendance d’animation externe', async () => {
    const modal = await readFile('src/components/public/LookModal.tsx', 'utf-8');
    expect(modal).toContain("'use client'");
    expect(modal).not.toContain('framer-motion');
    expect(modal).not.toContain('gsap');
    expect(modal).not.toContain('animejs');
  });

  it('accessibilité : dialog, aria-modal, Escape, piège Tab, scroll-lock restauré', async () => {
    const modal = await readFile('src/components/public/LookModal.tsx', 'utf-8');
    expect(modal).toContain('role="dialog"');
    expect(modal).toContain('aria-modal="true"');
    expect(modal).toContain("event.key === 'Escape'");
    expect(modal).toContain("event.key === 'Tab'");
    expect(modal).toContain("document.body.style.overflow = 'hidden'");
    expect(modal).toContain('document.body.style.overflow = previousOverflow');
  });

  it('focus : initial sur la fermeture, restitué à la carte d’origine au démontage', async () => {
    const modal = await readFile('src/components/public/LookModal.tsx', 'utf-8');
    expect(modal).toContain('closeRef.current?.focus()');
    expect(modal).toContain('restoreFocusRef.current?.focus?.()');
  });

  it('les pièces du look sont cliquables et ferment le modal avant navigation', async () => {
    const modal = await readFile('src/components/public/LookModal.tsx', 'utf-8');
    expect(modal).toContain('href={`/produit/${product.id}`}');
    expect(modal).toContain('import Link from \'next/link\';');
  });

  it('ajout panier avec confirmation visuelle puis fermeture automatique', async () => {
    const modal = await readFile('src/components/public/LookModal.tsx', 'utf-8');
    expect(modal).toContain('const ADDED_FEEDBACK_MS = 900');
    expect(modal).toContain('setAdded(true)');
    expect(modal).toContain('window.setTimeout(onClose, ADDED_FEEDBACK_MS)');
    expect(modal).toContain('Look ajouté au panier');
    expect(modal).toContain('disabled={added}');
  });

  it('relais WhatsApp identique à la page /looks', async () => {
    const modal = await readFile('src/components/public/LookModal.tsx', 'utf-8');
    expect(modal).toContain('buildWhatsAppUrl(message, whatsappPhone)');
    expect(modal).toContain('Je souhaite recréer ce look');
  });

  it('le carousel délègue au composant partagé, sans modal inline résiduel', async () => {
    const carousel = await readFile('src/components/public/home/OutfitCarousel.tsx', 'utf-8');
    expect(carousel).toContain('import { LookModal } from');
    expect(carousel).toContain('<LookModal');
    expect(carousel).toContain('onAdd={(look) => addMultipleToCart(look.products)}');
    expect(carousel).not.toContain('fixed inset-0 z-50 flex items-center justify-center');
    expect(carousel).toMatch(/import \{ Eye \} from 'lucide-react';/);
    expect(carousel).not.toContain('handleRecreateLook');
  });

  it('tokens IMP-01 uniquement + panier intact + CSS d’entrée défini', async () => {
    const modal = await readFile('src/components/public/LookModal.tsx', 'utf-8');
    expect(modal).toContain('duration-(--motion-micro)');
    expect(modal).not.toMatch(/duration-\d/);
    expect(modal).not.toContain('ease-[cubic-bezier');
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain('@keyframes look-modal-in');
    expect(css).toContain('.look-modal-in');
    const cart = await readFile('src/context/CartContext.tsx', 'utf-8');
    expect(cart).toContain('addMultipleToCart = (productsList: Product[])');
  });
});
