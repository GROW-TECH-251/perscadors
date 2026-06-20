// src/services/whatsappService.ts
// Génération du message WhatsApp à partir du panier

import type { CartItem } from '@/types';

const WHATSAPP_NUMBER = '22967280018';

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

  let msg = `👑 *HP COLLECTION — COMMANDE #${orderNumber}*\n\n`;
  msg += `👤 *Client :* ${clientName}\n`;
  msg += `📍 *Zone :* ${clientArea}\n\n`;
  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🛒 *ARTICLES*\n\n`;

  items.forEach((item, i) => {
    msg += `*${i + 1}. ${item.product.name}*\n`;
    msg += `   📏 Taille : ${item.selectedSize}\n`;
    msg += `   🎨 Couleur : ${item.selectedColor}\n`;
    msg += `   🔢 Qté : ${item.quantity}\n`;
    msg += `   💰 ${(item.product.price * item.quantity).toLocaleString()} FCFA\n\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🧾 Sous-total : ${subtotal.toLocaleString()} FCFA\n`;
  msg += `🚚 Livraison : ${deliveryFee === 0 ? 'À confirmer' : `${deliveryFee.toLocaleString()} FCFA`}\n`;
  msg += `✅ *TOTAL : ${grandTotal.toLocaleString()} FCFA*\n\n`;
  msg += `_Commande passée via hpcollection.bj_`;

  return msg;
}

export function openWhatsApp(message: string): void {
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}