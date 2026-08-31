import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fous PERF-05 — Admin : requêtes bornées + caches de session.
// Avant : chaque écran admin re-téléchargeait les tables entières (products,
// orders, categories, outfits) à chaque navigation, sans aucune borne.
// Après : fenêtres défensives + caches TTL courts, invalidés par CHAQUE
// mutation et par le realtime orders (jamais de données périmées).
// Cas particulier : fetchOrdersByPhone ne charge plus TOUTES les commandes
// pour l'historique d'un seul client.
describe('Unit — PERF-05 Admin : bornes + caches', () => {
  it('productService : fenêtre défensive + cache TTL + dédup in-flight', async () => {
    const s = await readFile('src/services/productService.ts', 'utf-8');
    expect(s).toContain('const ADMIN_PRODUCTS_MAX = 1000;');
    expect(s).toMatch(/\.limit\(ADMIN_PRODUCTS_MAX\)/);
    expect(s).toContain('const ADMIN_PRODUCTS_TTL_MS = 30_000;');
    expect(s).toContain('adminProductsCache.expiresAt > Date.now()');
    // Le cache doit bien être ÉCRIT après le fetch (pas seulement lu).
    expect(s).toContain('adminProductsCache = { value: products,');
    expect(s).toContain('adminProductsInFlight');
    expect(s).toContain('export function invalidateAdminProductsCache()');
  });

  it('productService : chaque mutation invalide le cache', async () => {
    const s = await readFile('src/services/productService.ts', 'utf-8');
    for (const fn of ['createProduct(', 'updateProduct(', 'deleteProduct(']) {
      const i = s.indexOf(`export async function ${fn}`);
      const body = s.slice(i, i + 400);
      expect(body).toContain('invalidateAdminProductsCache();');
    }
  });

  it('orderService : fenêtre 500 + cache TTL 30 s + in-flight conservé', async () => {
    const s = await readFile('src/services/orderService.ts', 'utf-8');
    expect(s).toContain('const ADMIN_ORDERS_WINDOW = 500;');
    expect(s).toMatch(/\.limit\(ADMIN_ORDERS_WINDOW\)/);
    expect(s).toContain('const ADMIN_ORDERS_TTL_MS = 30_000;');
    expect(s).toContain('adminOrdersCache.expiresAt > Date.now()');
    expect(s).toContain('export function invalidateAdminOrdersCache()');
    expect(s).toContain('adminOrdersCache = { value: orders,');
  });

  it('orderService : les 5 mutations invalident le cache orders', async () => {
    const s = await readFile('src/services/orderService.ts', 'utf-8');
    for (const fn of [
      'syncPendingOrders(',
      'createOrderFromCart(',
      'updateOrderStatus(',
      'updateOrder(',
      'deleteOrder(',
    ]) {
      const i = s.indexOf(`export async function ${fn}`);
      expect(i).toBeGreaterThan(-1);
      const body = s.slice(i, i + 500);
      expect(body).toContain('invalidateAdminOrdersCache();');
    }
  });

  it('fetchOrdersByPhone : requête ciblée, ne charge plus toutes les commandes', async () => {
    const s = await readFile('src/services/orderService.ts', 'utf-8');
    const i = s.indexOf('export async function fetchOrdersByPhone(');
    const body = s.slice(i, i + 1200);
    expect(body).toContain(".eq('client_phone', normalizedPhone)");
    expect(body).toContain('.limit(200)');
    expect(body).not.toContain('const allOrders = await fetchAdminOrders()');
    // Les commandes locales en attente de sync restent fusionnées.
    expect(body).toContain("sync_status === 'pending_sync'");
  });

  it('categoryService + outfitService : bornes 200 + caches TTL 60 s + invalidations', async () => {
    const c = await readFile('src/services/categoryService.ts', 'utf-8');
    expect(c).toContain('.limit(200)');
    expect(c).toContain('const ADMIN_CATEGORIES_TTL_MS = 60_000;');
    expect(c).toContain('export function invalidateAdminCategoriesCache()');
    expect(c).toContain('adminCategoriesCache = { value: categories,');
    for (const fn of ['createCategory(', 'updateCategory(', 'deleteCategory(', 'reorderCategories(']) {
      const i = c.indexOf(`export async function ${fn}`);
      expect(c.slice(i, i + 400)).toContain('invalidateAdminCategoriesCache();');
    }

    const o = await readFile('src/services/outfitService.ts', 'utf-8');
    expect(o).toContain('.limit(200)');
    expect(o).toContain('const ADMIN_OUTFITS_TTL_MS = 60_000;');
    expect(o).toContain('export function invalidateAdminOutfitsCache()');
    expect(o).toContain('adminOutfitsCache = { value: outfits,');
    for (const fn of ['createOutfit(', 'updateOutfit(', 'deleteOutfit(']) {
      const i = o.indexOf(`export async function ${fn}`);
      expect(o.slice(i, i + 400)).toContain('invalidateAdminOutfitsCache();');
    }
  });

  it('useOrdersRealtime : le realtime invalide le cache orders (pas de périmé)', async () => {
    const h = await readFile('src/hooks/useOrdersRealtime.ts', 'utf-8');
    expect(h).toContain("import { invalidateAdminOrdersCache } from '@/services/orderService';");
    expect(h).toMatch(/postgres_changes[\s\S]{0,400}invalidateAdminOrdersCache\(\);/);
  });

  it('les caches ne fuient pas vers la vitrine publique : importeurs admin uniquement', async () => {
    const { execSync } = await import('node:child_process');
    const out = execSync(
      "grep -rl \"from '@/services/categoryService'\\|from '@/services/outfitService'\" src/ | sort",
      { encoding: 'utf-8', shell: '/bin/bash' }
    );
    for (const line of out.trim().split('\n').filter(Boolean)) {
      expect(line.startsWith('src/app/admin/')).toBe(true);
    }
  });
});
