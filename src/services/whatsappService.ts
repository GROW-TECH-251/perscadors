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
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${cleaned}?text=${encoded}`;
  window.open(url, '_blank');
}

export function buildWhatsAppUrl(message: string, phoneDigits?: string): string {
  const cleaned = resolveWhatsAppPhone(phoneDigits);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}
