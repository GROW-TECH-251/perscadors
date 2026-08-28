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

  it('le proxy (ex-middleware) doit protéger /admin', async () => {
    const { readFile } = await import('fs/promises');
    const proxyContent = await readFile('src/proxy.ts', 'utf-8');
    expect(proxyContent).toContain('export async function proxy');
    expect(proxyContent).toContain('/admin');
    expect(proxyContent).toContain('matcher');
  });

  it('la migration RLS doit supprimer la policy d auto-élévation profiles_update_own', async () => {
    const { readFile } = await import('fs/promises');
    const migration = await readFile('supabase/migrations/restrict_profile_role_updates.sql', 'utf-8');
    expect(migration.trim().length).toBeGreaterThan(0);
    expect(migration).toContain('drop policy if exists profiles_update_own on public.profiles');
  });
});
