import { describe, it, expect, afterAll } from 'vitest';
import { readFile } from 'fs/promises';
import { buildWhatsAppOrderMessage, resolvePublicImageUrl } from '@/services/orderService';
import { getDefaultShopSettings } from '@/services/settingsService';

// E11 — réintégration sélective de feature/whatsapp-public-photo-links :
// les photos transmises via WhatsApp doivent être des URLs ABSOLUES (cliquables
// et avec aperçu dans le chat), jamais des chemins relatifs.

const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
afterAll(() => {
  if (originalSiteUrl === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
});

describe('resolvePublicImageUrl (E11)', () => {
  it('retourne une chaîne vide sans valeur utilisable', () => {
    expect(resolvePublicImageUrl(null)).toBe('');
    expect(resolvePublicImageUrl(undefined)).toBe('');
    expect(resolvePublicImageUrl('')).toBe('');
    expect(resolvePublicImageUrl('   ')).toBe('');
  });

  it('laisse une URL absolue http(s) intacte', () => {
    expect(resolvePublicImageUrl('https://res.cloudinary.com/bucket/img.jpg')).toBe('https://res.cloudinary.com/bucket/img.jpg');
    expect(resolvePublicImageUrl('http://exemple.com/a.png')).toBe('http://exemple.com/a.png');
  });

  it('résout un chemin relatif avec NEXT_PUBLIC_SITE_URL (repli serveur)', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://perscadors-test.vercel.app';
    expect(resolvePublicImageUrl('/assets/collections/a.jpg')).toBe('https://perscadors-test.vercel.app/assets/collections/a.jpg');
    delete process.env.NEXT_PUBLIC_SITE_URL;
  });

  it('utilise le domaine de production par défaut sans variable', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL;
    expect(resolvePublicImageUrl('/img/x.webp')).toBe('https://perscadors.vercel.app/img/x.webp');
  });

  it('retourne la valeur brute si la construction d URL échoue', () => {
    expect(resolvePublicImageUrl('http://in valide.com/x.jpg')).toBe('http://in valide.com/x.jpg');
  });
});

describe('photos WhatsApp — comportement de bout en bout (E11)', () => {
  it('message de commande : la photo relative devient une URL absolue', () => {
    const message = buildWhatsAppOrderMessage(
      {
        order_number: 'CMD-E11',
        idempotency_key: 'cle-e11',
        client_name: 'Test',
        client_phone: '+22990000000',
        client_area: 'Cotonou',
        items: [
          { name: 'Baskets Test', quantity: 1, price: 10000, size: '42', color: 'Noir', image: '/assets/collections/b.jpg' }
        ],
        subtotal: 10000,
        delivery_fee: 0,
        total: 10000
      } as Parameters<typeof buildWhatsAppOrderMessage>[0],
      getDefaultShopSettings().checkout_order_template
    );
    expect(message).toContain('https://perscadors.vercel.app/assets/collections/b.jpg');
    expect(message).not.toContain('Photo : /assets');
  });

  it('message « demande de dispo » : ligne photo gardée par composant (aucune ligne vide sans image)', async () => {
    const detail = await readFile('src/app/produit/[id]/product-detail-client.tsx', 'utf-8');
    expect(detail).toContain("import { resolvePublicImageUrl } from '@/services/orderService';");
    expect(detail).toContain('const photoUrl = resolvePublicImageUrl(');
    expect(detail).toContain("photoUrl ? `📸 *Photo :* ${photoUrl}");
  });
});
