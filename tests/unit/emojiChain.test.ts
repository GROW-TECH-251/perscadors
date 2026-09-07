import { describe, it, expect } from 'vitest';
import { searchCatalogProducts } from '@/services/publicCatalogService';
import { buildWhatsAppUrl, buildWhatsAppMessage } from '@/services/whatsappService';
import type { CartItem, Product } from '@/types';

// E3 — Chaîne multi-emoji de bout en bout (recherche -> message -> URL wa.me).
// Objectif : aucun emoji ne doit être cassé (demi-surrogate -> U+FFFD) ni
// corrompre le comportement du site. Comportements mesurés tels qu'assistés,
// y compris la limite documentée « texte + emoji » en recherche (cf. NOTE E3,
// traitement prévu en E4 Search UX).

const FIXTURES: Product[] = [
  {
    id: '1',
    name: 'Basket Urban Luxe Gold',
    slug: 'basket-urban-luxe-gold',
    category: 'basket-pour-homme',
    price: 24500,
    image_url: '/img.jpg',
    images: ['/img.jpg'],
    sizes: ['41', '42'],
    outOfStockSizes: [],
    colors: ['Or'],
    outOfStockColors: [],
    inStock: true,
    description: 'Affirmez votre statut avec cette basket unique.',
    isPopular: false,
  },
  {
    id: '2',
    name: 'Sneaker High Top Noir Intense',
    slug: 'sneaker-high-top',
    category: 'basket-pour-homme',
    price: 25000,
    image_url: '/img2.jpg',
    images: ['/img2.jpg'],
    sizes: ['43'],
    outOfStockSizes: [],
    colors: ['Noir'],
    outOfStockColors: [],
    inStock: true,
    description: 'Un style élégant et intemporel.',
    isPopular: false,
  },
];

// Aucun caractère de remplacement, aucun sélecteur de variation (règle
// finalPolish), aucun emoji coupé (moitié de paire surrogate).
function chaineSaine(texte: string): boolean {
  if (texte.includes('\uFFFD') || texte.includes('\uFE0F')) return false;
  for (let i = 0; i < texte.length; i += 1) {
    const code = texte.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = i + 1 < texte.length ? texte.charCodeAt(i + 1) : 0;
      if (next < 0xdc00 || next > 0xdfff) return false;
      i += 1;
    } else if (code >= 0xdc00 && code <= 0xdfff) return false;
  }
  return true;
}

const item = {
  product: FIXTURES[0],
  quantity: 2,
  selectedSize: '42',
  selectedColor: 'Or',
} as unknown as CartItem;

describe('Unit — E3 chaîne multi-emoji', () => {
  it('recherche : requête 100% emoji ne crashe pas et ne renvoie rien de faux', () => {
    expect(searchCatalogProducts(FIXTURES, '👟🔥🙌')).toEqual([]);
    expect(searchCatalogProducts(FIXTURES, '🔥')).toEqual([]);
  });

  it('recherche : texte + emoji = 0 résultat (limite documentée, traitement E4)', () => {
    // La normalisation conserve les emojis : « basket 🔥 » exige la sous-chaîne
    // entière dans le nom -> 0. Comportement actuel figé ici pour éviter toute
    // régression silencieuse ; amélioration prévue en E4 (Search UX).
    expect(searchCatalogProducts(FIXTURES, 'basket 🔥👟')).toEqual([]);
    // contrôle sain adjacent : le texte seul trouve bien les articles.
    expect(searchCatalogProducts(FIXTURES, 'basket')).toHaveLength(2);
  });

  it('message de commande : les emojis du template arrivent entiers', () => {
    const message = buildWhatsAppMessage({
      orderNumber: 'HP-260906-TEST',
      clientName: 'Naïve œuvre café',
      clientArea: 'Cotonou',
      items: [item],
      subtotal: 49000,
      deliveryFee: 1000,
      grandTotal: 50000,
    });
    expect(message).toContain('👋');
    expect(message).toContain('🙂');
    expect(chaineSaine(message)).toBe(true);
  });

  it('URL wa.me : round-trip multi-emoji + accents sans corruption', () => {
    const message = 'Bonjour 👋 Sneaker 🔥👟🙌 Naïve café œ — ünïcödé';
    const url = buildWhatsAppUrl(message, '+229 97 00 00 00');
    expect(url.startsWith('https://wa.me/229')).toBe(true);
    const decoded = decodeURIComponent(url.split('text=')[1] ?? '');
    expect(decoded).toBe(message.normalize('NFC'));
    expect(chaineSaine(decoded)).toBe(true);
  });

  it('plafond 1600 : un long message multi-emoji est coupé sans casser d emoji', () => {
    const long = 'Sneaker 🔥👟 ligne complète de message suffisamment longue 👌\n'.repeat(80);
    const url = buildWhatsAppUrl(long);
    const decoded = decodeURIComponent(url.split('text=')[1] ?? '');
    expect(decoded.length).toBeLessThanOrEqual(1600);
    expect(chaineSaine(decoded)).toBe(true);
  });
});
