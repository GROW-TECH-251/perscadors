import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockImplementation(() => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn(),
    })),
  }),
}));

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/rateLimit', () => ({
  enforceRateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }),
}));

vi.mock('@/lib/securityAudit', () => ({
  recordSecurityEvent: vi.fn(),
}));

describe('SEC-9 / Checkout API — /api/checkout', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { enforceRateLimit } = await import('@/lib/rateLimit');
    (enforceRateLimit as any).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  });

  it('doit retourner 400 si le payload est vide', async () => {
    const request = new Request('http://localhost/api/checkout', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const { POST } = await import('@/app/api/checkout/route');
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('doit retourner 400 si le turnstileToken est absent', async () => {
    const request = new Request('http://localhost/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_number: 'HP-20260101-0001',
        idempotency_key: 'key-1',
        client_name: 'Client',
        client_area: 'Zone',
        items: [{ name: 'Produit', price: 10000, quantity: 1, size: 'M', color: 'Noir' }],
        subtotal: 10000,
        delivery_fee: 0,
        total: 10000,
      }),
    });

    const { POST } = await import('@/app/api/checkout/route');
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('doit retourner 429 si le rate limit est atteint', async () => {
    const rateLimit = await import('@/lib/rateLimit');
    (rateLimit.enforceRateLimit as any).mockResolvedValue({ allowed: false, retryAfterSeconds: 600 });

    const request = new Request('http://localhost/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        turnstileToken: 'token',
        order_number: 'HP-20260101-0001',
        idempotency_key: 'key-2',
        client_name: 'Client',
        client_area: 'Zone',
        items: [{ name: 'Produit', price: 10000, quantity: 1, size: 'M', color: 'Noir' }],
        subtotal: 10000,
        delivery_fee: 0,
        total: 10000,
      }),
    });

    const { POST } = await import('@/app/api/checkout/route');
    const response = await POST(request);
    expect(response.status).toBe(429);
  });
});
