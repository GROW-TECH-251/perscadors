/**
 * WhatsApp helper service (Perscadors)
 * Used by checkout flow and tracking
 */

export function normalizePhoneForWhatsApp(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function openWhatsApp(message: string, phoneDigits: string = '22967280018') {
  const cleaned = normalizePhoneForWhatsApp(phoneDigits);
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${cleaned}?text=${encoded}`;
  window.open(url, '_blank');
}

export function buildWhatsAppUrl(message: string, phoneDigits?: string): string {
  const cleaned = normalizePhoneForWhatsApp(phoneDigits || '22967280018');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}
