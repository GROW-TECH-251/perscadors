import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fous AUDIT LATENCE 09/2026 — optimisations ciblées et mesurées :
// - P1 : anti double-soumission des formulaires produit (ref in-flight) ;
// - P2 : le catalogue public (contextes racine) ne se charge PAS sur /admin ;
// - P4 : l'hydratation serveur gagne la course (seed au RENDER + store abonné) ;
// - P5 : settings transmis au DataHydrator sur toutes les pages publiques ;
// - P6 : login — événements de sécurité journalisés sans bloquer la réponse.
// Le proxy d'authentification reste INTACT (décision explicite : sécurité max).
describe('Unit — Audit latence : optimisations mesurées', () => {
  it('P1 : les deux formulaires produit bloquent la double-soumission par ref', async () => {
    for (const file of ['src/app/admin/produits/[id]/page.tsx', 'src/app/admin/produits/nouveau/page.tsx']) {
      const form = await readFile(file, 'utf-8');
      expect(form).toContain('const submittingRef = useRef(false);');
      expect(form).toContain('if (submittingRef.current) return;');
      expect(form).toContain('submittingRef.current = true;');
      expect(form).toContain('submittingRef.current = false;');
    }
  });

  it('P2 : CatalogContext ignore les routes admin (pas de catalogue public, pas de websocket)', async () => {
    const ctx = await readFile('src/context/CatalogContext.tsx', 'utf-8');
    expect(ctx).toContain("pathname?.startsWith('/admin')");
    expect(ctx).toContain('if (isAdminArea) {');
    expect(ctx).toContain('!isAdminArea');
    const hook = await readFile('src/hooks/useCatalogRealtime.ts', 'utf-8');
    expect(hook).toContain('enabled = true');
    expect(hook).toContain('if (!client || !enabled) return;');
    expect(hook).toContain('}, [id, enabled]);');
  });

  it('P4 : DataHydrator sème pendant le render (plus de course effet-parent/effet-enfant)', async () => {
    const h = await readFile('src/components/public/DataHydrator.tsx', 'utf-8');
    expect(h).not.toContain('useEffect');
    expect(h).toContain('if (snapshot) hydrateCatalogSnapshot(snapshot);');
    const ctx = await readFile('src/context/CatalogContext.tsx', 'utf-8');
    expect(ctx).toContain('useState(() => injectedCatalogSnapshot ?? fallbackSnapshot)');
    expect(ctx).toContain('subscribeCatalogHydration');
    expect(ctx).toContain('queueMicrotask');
  });

  it('P5 : toutes les pages publiques passent settings au DataHydrator (zéro re-fetch settings)', async () => {
    for (const file of ['src/app/page.tsx', 'src/app/looks/page.tsx', 'src/app/categorie/[slug]/page.tsx', 'src/app/produit/[id]/page.tsx']) {
      const page = await readFile(file, 'utf-8');
      expect(page).toContain('fetchServerPublicShopSettings');
      expect(page).toContain('settings={settings}');
    }
  });

  it('P6 : login — audits de sécurité en fire-and-forget (chaîne séquentielle raccourcie)', async () => {
    const route = await readFile('src/app/api/auth/admin-login/route.ts', 'utf-8');
    expect(route.match(/void recordSecurityEvent/g)?.length).toBe(3);
    expect(route).not.toContain('await recordSecurityEvent');
    // Sécurité INTACTE : rate-limit, Turnstile, auth et rôle toujours séquentiels.
    expect(route).toContain('enforceRateLimit');
    expect(route).toContain('verifyTurnstile');
    expect(route).toContain('signInWithPassword');
    expect(route).toContain("profile?.role !== 'admin'");
  });

  it('P3 (refusé explicitement) : le proxy d authentification reste inchangé', async () => {
    const proxy = await readFile('src/proxy.ts', 'utf-8');
    expect(proxy).toContain('await supabase.auth.getUser()');
    expect(proxy).toContain(".from('profiles').select('role')");
    expect(proxy).not.toContain('authVerdictCache');
  });
});
