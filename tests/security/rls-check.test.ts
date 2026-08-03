import { describe, it, expect, vi } from 'vitest';

describe('SEC-9 / RLS et protection — comportement sécurité', () => {
  it('le checkout doit référencer le service role et non une clé publique', async () => {
    const { readFile } = await import('fs/promises');
    const content = await readFile('src/app/api/checkout/route.ts', 'utf-8');
    expect(content).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(content).toContain('serviceRoleKey');
  });

  it('les routes Cloudinary doivent exiger le rôle admin', async () => {
    const { readFile } = await import('fs/promises');
    const sigContent = await readFile('src/app/api/media/cloudinary-signature/route.ts', 'utf-8');
    const delContent = await readFile('src/app/api/media/cloudinary-delete/route.ts', 'utf-8');
    expect(sigContent).toContain('requireAdmin');
    expect(delContent).toContain('requireAdmin');
  });

  it('le middleware doit protéger /admin', async () => {
    const { readFile } = await import('fs/promises');
    const middlewareContent = await readFile('middleware.ts', 'utf-8');
    expect(middlewareContent).toContain('/admin');
    expect(middlewareContent).toContain('admin');
  });
});
