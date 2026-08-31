/**
 * WhatsApp helper service (Perscadors)
 * Used by checkout flow and tracking
 */

import type { CartItem } from '@/types';

export function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function generateOrderNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(-2);
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `HP-${y}${m}${d}-${rand}`;
}

export function buildWhatsAppMessage(params: {
  orderNumber: string;
  clientName: string;
  clientArea: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
}): string {
  const { orderNumber, clientName, clientArea, items, subtotal, deliveryFee, grandTotal } = params;
  const itemsList = items
    .map((item) => `• ${item.product.name} — ${item.quantity} × ${(item.product.price * item.quantity).toLocaleString()} FCFA\n  ${item.selectedSize}, ${item.selectedColor}`)
    .join('\n');
  const deliveryLabel = deliveryFee > 0 ? `${deliveryFee.toLocaleString()} FCFA` : 'à confirmer';

  return `Bonjour 👋\n\nCommande ${orderNumber}\n\nClient : ${clientName}\nVille : ${clientArea}\n\nArticles\n${itemsList}\n\nSous-total : ${subtotal.toLocaleString()} FCFA\nFrais de livraison : ${deliveryLabel}\nTotal des articles : ${grandTotal.toLocaleString()} FCFA\n\nMerci, on confirme les détails ensemble sur WhatsApp 🙂`;
}

/**
 * Source unique du numéro WhatsApp public (Impl 8).
 * Chaîne de résolution : settings.whatsapp_phone (base de données) → variable
 * d'environnement NEXT_PUBLIC_WHATSAPP_PHONE_DIGITS (repli déploiement) →
 * défaut historique 22967280018. Avant, plusieurs pages codaient en dur
 * 22967280018 ou lisaient l'env directement : un changement de numéro dans
 * Réglages ne se propageait pas partout.
 */
const DEFAULT_WHATSAPP_DIGITS = '22967280018';

export function resolveWhatsAppPhone(settingsPhone?: string | null): string {
  const fromSettings = normalizePhoneForWhatsApp(settingsPhone || '');
  if (fromSettings) return fromSettings;

  const fromEnv = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_DIGITS?.trim() || '';
  if (fromEnv) return normalizePhoneForWhatsApp(fromEnv);

  return DEFAULT_WHATSAPP_DIGITS;
}

export function openWhatsApp(message: string, phoneDigits?: string) {
  const cleaned = resolveWhatsAppPhone(phoneDigits);
  const encoded = encodeURIComponent(normalizeWhatsAppMessage(message));
  const url = `https://wa.me/${cleaned}?text=${encoded}`;
  window.open(url, '_blank');
}

export function buildWhatsAppUrl(message: string, phoneDigits?: string): string {
  const cleaned = resolveWhatsAppPhone(phoneDigits);
  const encoded = encodeURIComponent(normalizeWhatsAppMessage(message));
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

// ============================================
// PERF-04 — Robustesse d'encodage des messages WhatsApp.
// Les caracteres � observés provenaient de messages longs coupés entre deux
// « surrogate halves » d'un emoji (toute troncature naive d'un texte contenant
// 👋/📸/🙌 produit un demi-caractère invalide). Deux gardes :
// 1) normalisation NFC (forme composée : moins d'unites de code, rendu stable) ;
// 2) plafond appliqué CÔTÉ CLIENT avec coupe sûre — jamais au milieu d'une
//    paire de surrogate, de preference sur une frontière mot/ligne.
const WHATSAPP_MESSAGE_MAX_CHARS = 1600;

export function normalizeWhatsAppMessage(message: string): string {
  const nfc = message.normalize('NFC');
  if (nfc.length <= WHATSAPP_MESSAGE_MAX_CHARS) return nfc;

  const bound = nfc.slice(0, WHATSAPP_MESSAGE_MAX_CHARS);
  // Retire un éventuel demi-emoji de fin (surrogate haut orphelin).
  const safe = /[\uD800-\uDBFF]$/.test(bound) ? bound.slice(0, -1) : bound;
  const lastBreak = Math.max(safe.lastIndexOf('\n'), safe.lastIndexOf(' '));
  const cutAt = lastBreak > WHATSAPP_MESSAGE_MAX_CHARS * 0.6 ? lastBreak : safe.length;
  return `${safe.slice(0, cutAt).trimEnd()}…`;
}
