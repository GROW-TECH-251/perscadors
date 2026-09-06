import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/requireAdmin', () => ({
  requireAdmin: vi.fn(),
}));

vi.mock('@/lib/rateLimit', () => ({
  enforceRateLimit: vi.fn().mockResolvedValue({ allowed: true, retryAfterSeconds: 0 }),
}));

vi.mock('@/lib/securityAudit', () => ({
  recordSecurityEvent: vi.fn(),
}));

// E2 — le helper isAllowedMediaFolder (garde des dossiers) est importé par la
// route depuis ce module : on garde l'implémentation RÉELLE (la garde doit être
// testée) et on ne moque que le SDK cloudinary (signature).
vi.mock('@/lib/cloudinary', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/cloudinary')>();
  return {
    ...actual,
    cloudinary: {
      utils: {
        api_sign_request: vi.fn().mockReturnValue('mock-signature'),
      },
    },
  };
});

import { requireAdmin } from '@/lib/requireAdmin';

describe('SEC-9 / Cloudinary API — /api/media/cloudinary-signature', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
    process.env.CLOUDINARY_API_KEY = 'test-key';
    process.env.CLOUDINARY_API_SECRET = 'test-secret';
    const { enforceRateLimit } = await import('@/lib/rateLimit');
    (enforceRateLimit as any).mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
  });

  it('doit retourner 403 si l\'utilisateur n\'est pas admin', async () => {
    (requireAdmin as any).mockResolvedValue(false);

    const request = new Request('http://localhost/api/media/cloudinary-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'perscadors/hero' }),
    });

    const { POST } = await import('@/app/api/media/cloudinary-signature/route');
    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it('doit retourner 400 si le dossier n\'est pas autorisé', async () => {
    (requireAdmin as any).mockResolvedValue(true);

    const request = new Request('http://localhost/api/media/cloudinary-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'perscadors/illegal' }),
    });

    const { POST } = await import('@/app/api/media/cloudinary-signature/route');
    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('doit retourner 200 si l\'admin demande un dossier autorisé', async () => {
    (requireAdmin as any).mockResolvedValue(true);

    const request = new Request('http://localhost/api/media/cloudinary-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'perscadors/hero' }),
    });

    const { POST } = await import('@/app/api/media/cloudinary-signature/route');
    const response = await POST(request);
    expect(response.status).toBe(200);
  });
});

  it('E2 : accepte un dossier vidéo produit « perscadors/products/<id> »', async () => {
    (requireAdmin as any).mockResolvedValue(true);

    const request = new Request('http://localhost/api/media/cloudinary-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'perscadors/products/12' }),
    });

    const { POST } = await import('@/app/api/media/cloudinary-signature/route');
    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('E2 : refuse un dossier produit sans segment (traversal)', async () => {
    (requireAdmin as any).mockResolvedValue(true);

    const request = new Request('http://localhost/api/media/cloudinary-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder: 'perscadors/products/../../elsewhere' }),
    });

    const { POST } = await import('@/app/api/media/cloudinary-signature/route');
    const response = await POST(request);
    expect(response.status).toBe(400);
  });
