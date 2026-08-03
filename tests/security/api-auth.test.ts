import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NextRequest } from 'next/server';

// Mock des modules serveur utilisés par les routes API
vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({
  enforceRateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }),
}));

vi.mock('@/lib/turnstile', () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/lib/securityAudit', () => ({
  recordSecurityEvent: vi.fn(),
}));

import { enforceRateLimit } from '@/lib/rateLimit';
import { verifyTurnstile } from '@/lib/turnstile';
import { recordSecurityEvent } from '@/lib/securityAudit';

describe('SEC-9 / Auth API — /api/auth/admin-login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (enforceRateLimit as any).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    (verifyTurnstile as any).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('doit retourner 400 pour un payload vide', async () => {
    const request = new Request('http://localhost/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const { POST } = await import('@/app/api/auth/admin-login/route');
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('doit retourner 400 si captchaToken est absent', async () => {
    const request = new Request('http://localhost/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'secret' }),
    });

    const { POST } = await import('@/app/api/auth/admin-login/route');
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('doit retourner 400 si le payload dépasse la limite de taille', async () => {
    const request = new Request('http://localhost/api/auth/admin-login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'a'.repeat(300),
        captchaToken: 'token',
      }),
    });

    const { POST } = await import('@/app/api/auth/admin-login/route');
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('doit retourner 429 si le rate limit bloque la requête', async () => {
    (enforceRateLimit as any).mockResolvedValue({ allowed: false, retryAfterSeconds: 900 });

    const request = new Request('http://localhost/api/auth/admin-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password',
        captchaToken: 'valid-token',
      }),
    });

    const { POST } = await import('@/app/api/auth/admin-login/route');
    const response = await POST(request);
    expect(response.status).toBe(429);
  });
});
