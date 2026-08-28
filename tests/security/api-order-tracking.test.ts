import { describe, it, expect, vi, beforeEach } from 'vitest';

const mocks = vi.hoisted(() => ({
  maybeSingle: vi.fn(),
  createClient: vi.fn(),
  enforceRateLimit: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => mocks.createClient(...args),
}));

vi.mock('@/lib/rateLimit', () => ({
  enforceRateLimit: (...args: unknown[]) => mocks.enforceRateLimit(...args),
}));

describe('SEC / Suivi de commande — /api/order/[token]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.enforceRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.createClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: mocks.maybeSingle,
          }),
        }),
      }),
    });
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  const makeRequest = (token: string) =>
    new Request(`http://localhost/api/order/${token}`, { method: 'GET' });

  it('doit retourner 404 si le token est malformé', async () => {
    const { GET } = await import('@/app/api/order/[token]/route');
    const response = await GET(makeRequest('ABC-123'), {
      params: Promise.resolve({ token: 'ABC-123' }),
    });
    expect(response.status).toBe(404);
  });

  it('doit retourner 429 si le rate limit est atteint', async () => {
    mocks.enforceRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 600 });
    const { GET } = await import('@/app/api/order/[token]/route');
    const response = await GET(makeRequest('HP-20260828-1234'), {
      params: Promise.resolve({ token: 'HP-20260828-1234' }),
    });
    expect(response.status).toBe(429);
  });

  it('doit retourner 503 si la clé service_role est absente', async () => {
    const { GET } = await import('@/app/api/order/[token]/route');
    const response = await GET(makeRequest('HP-20260828-1234'), {
      params: Promise.resolve({ token: 'HP-20260828-1234' }),
    });
    expect(response.status).toBe(503);
  });

  it('doit retourner 200 avec uniquement les champs non sensibles', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    mocks.maybeSingle.mockResolvedValue({
      data: {
        order_number: 'HP-20260828-1234',
        status: 'EN LIVRAISON',
        created_at: '2026-08-28T00:00:00.000Z',
        client_name: 'Jean Dupont',
        client_phone: '22997123456',
        client_area: 'Cotonou',
        idempotency_key: '00000000-0000-4000-8000-000000000000',
        items: [{ name: 'Ensemble Bazin', price: 15000, quantity: 2, size: 'M', color: 'Noir' }],
        subtotal: 30000,
        delivery_fee: 2000,
        total: 32000,
        history: [{ status: 'EN ATTENTE', date: '2026-08-28T00:00:00.000Z', note: 'Commande créée' }],
      },
      error: null,
    });

    const { GET } = await import('@/app/api/order/[token]/route');
    const response = await GET(makeRequest('HP-20260828-1234'), {
      params: Promise.resolve({ token: 'HP-20260828-1234' }),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.order_number).toBe('HP-20260828-1234');
    expect(body.status).toBe('EN LIVRAISON');
    expect(body.items).toHaveLength(1);
    expect(body.items[0].name).toBe('Ensemble Bazin');
    expect(body.total).toBe(32000);
    expect(body.subtotal).toBe(30000);
    expect(body.delivery_fee).toBe(2000);
    expect(body.history).toHaveLength(1);

    // Aucune donnée personnelle ne doit fuiter via cette route.
    expect(body.client_name).toBeUndefined();
    expect(body.client_phone).toBeUndefined();
    expect(body.client_area).toBeUndefined();
    expect(body.idempotency_key).toBeUndefined();
  });

  it('doit retourner 404 si aucune commande ne correspond', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });

    const { GET } = await import('@/app/api/order/[token]/route');
    const response = await GET(makeRequest('HP-20260828-1234'), {
      params: Promise.resolve({ token: 'HP-20260828-1234' }),
    });

    expect(response.status).toBe(404);
  });
});
