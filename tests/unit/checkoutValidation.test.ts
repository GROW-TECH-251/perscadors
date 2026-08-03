import { describe, it, expect } from 'vitest';
import { isValidCheckoutPayload } from '@/lib/checkoutValidation';

describe('Unit — checkoutValidation', () => {
  it('commande complète cohérente doit passer', () => {
    const payload = {
      turnstileToken: 'a'.repeat(30),
      order_number: 'HP-20260101-0001',
      idempotency_key: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      client_name: 'Client',
      client_phone: '+33123456789',
      client_area: 'Zone A',
      items: [{ name: 'Produit', price: 10000, quantity: 1, size: 'M', color: 'Noir' }],
      subtotal: 10000,
      delivery_fee: 0,
      total: 10000,
    };
    expect(isValidCheckoutPayload(payload)).toBe(true);
  });

  it('total incohérent doit être refusé', () => {
    const payload = {
      turnstileToken: 'a'.repeat(30),
      order_number: 'HP-20260101-0001',
      idempotency_key: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      client_name: 'Client',
      client_phone: '+33123456789',
      client_area: 'Zone A',
      items: [{ name: 'Produit', price: 10000, quantity: 2, size: 'M', color: 'Noir' }],
      subtotal: 5000,
      delivery_fee: 5000,
      total: 5000,
    };
    expect(isValidCheckoutPayload(payload)).toBe(false);
  });

  it('UUID idempotent invalide doit être refusé', () => {
    const payload = {
      turnstileToken: 'a'.repeat(30),
      order_number: 'HP-20260101-0001',
      idempotency_key: 'invalid-uuid',
      client_name: 'Client',
      client_phone: '+33123456789',
      client_area: 'Zone A',
      items: [{ name: 'Produit', price: 5000, quantity: 1, size: 'M', color: 'Noir' }],
      subtotal: 5000,
      delivery_fee: 0,
      total: 5000,
    };
    expect(isValidCheckoutPayload(payload)).toBe(false);
  });

  it('panier vide doit être refusé', () => {
    const payload = {
      turnstileToken: 'a'.repeat(30),
      order_number: 'HP-20260101-0001',
      idempotency_key: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      client_name: 'Client',
      client_phone: '+33123456789',
      client_area: 'Zone A',
      items: [],
      subtotal: 0,
      delivery_fee: 0,
      total: 0,
    };
    expect(isValidCheckoutPayload(payload)).toBe(false);
  });

  it('token anti-bot absent doit être refusé', () => {
    const payload = {
      turnstileToken: '',
      order_number: 'HP-20260101-0001',
      idempotency_key: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
      client_name: 'Client',
      client_phone: '+33123456789',
      client_area: 'Zone A',
      items: [{ name: 'Produit', price: 5000, quantity: 1, size: 'M', color: 'Noir' }],
      subtotal: 5000,
      delivery_fee: 0,
      total: 5000,
    };
    expect(isValidCheckoutPayload(payload)).toBe(false);
  });
});
