import { describe, it, expect, beforeEach } from 'vitest';
import { readFile } from 'fs/promises';

// Impl 8 — Garde-fous contre la régression "numéro WhatsApp incohérent".
// Source unique = settings.whatsapp_phone, avec repli env puis défaut.
describe('Impl 8 — source unique du numéro WhatsApp', () => {
  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_WHATSAPP_PHONE_DIGITS;
  });

  it('resolveWhatsAppPhone utilise le numéro des réglages en priorité', async () => {
    const { resolveWhatsAppPhone } = await import('@/services/whatsappService');
    expect(resolveWhatsAppPhone('22997123456')).toBe('22997123456');
    expect(resolveWhatsAppPhone('+229 97 12 34 56')).toBe('22997123456');
  });

  it('resolveWhatsAppPhone retombe sur l env puis sur le défaut', async () => {
    const { resolveWhatsAppPhone } = await import('@/services/whatsappService');
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE_DIGITS = '22990001122';
    expect(resolveWhatsAppPhone('')).toBe('22990001122');
    delete process.env.NEXT_PUBLIC_WHATSAPP_PHONE_DIGITS;
    expect(resolveWhatsAppPhone('')).toBe('22967280018');
  });

  it('buildWhatsAppUrl construit une URL wa.me normalisée', async () => {
    const { buildWhatsAppUrl } = await import('@/services/whatsappService');
    const url = buildWhatsAppUrl('Bonjour', '22997123456');
    expect(url).toBe(`https://wa.me/22997123456?text=${encodeURIComponent('Bonjour')}`);
  });

  it('les pages publiques ne doivent plus coder en dur 22967280018', async () => {
    const produit = await readFile('src/app/produit/[id]/page.tsx', 'utf-8');
    const order = await readFile('src/app/order/[token]/page.tsx', 'utf-8');
    const looks = await readFile('src/app/looks/page.tsx', 'utf-8');

    expect(produit).not.toContain('wa.me/22967280018');
    expect(order).not.toContain('wa.me/22967280018');
    expect(looks).not.toContain('wa.me/22967280018');
  });

  it('les pages publiques consomment settings.whatsapp_phone', async () => {
    const produit = await readFile('src/app/produit/[id]/page.tsx', 'utf-8');
    const order = await readFile('src/app/order/[token]/page.tsx', 'utf-8');
    const looks = await readFile('src/app/looks/page.tsx', 'utf-8');

    expect(produit).toContain('settings.whatsapp_phone');
    expect(order).toContain('settings.whatsapp_phone');
    expect(looks).toContain('settings.whatsapp_phone');
  });

  it('la page looks ne doit plus lire l env directement dans le rendu', async () => {
    const looks = await readFile('src/app/looks/page.tsx', 'utf-8');
    expect(looks).not.toContain('NEXT_PUBLIC_WHATSAPP_PHONE_DIGITS');
  });
});
