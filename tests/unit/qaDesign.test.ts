import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { execSync } from 'node:child_process';
import { access } from 'node:fs/promises';

// Garde-fou IMP-11 — Design QA + accessibilité + garde SEO (audit transverse) :
// - CSS mort supprimé et absent de tout src/ ;
// - prefers-reduced-motion global couvrant * (animations ET transitions) ;
// - focus-visible global ; <html lang="fr"> ; sitemap + robots présents ;
// - metadata exports intacts + generateMetadata sur les pages publiques ;
// - chaîne uploadDate : AdminProduct.created_at -> Product.createdAt -> VideoObject ;
// - JSON-LD produit intact (offers/XOF) + assaini via safeJsonLd ;
// - tokens IMP-01 toujours en place.
describe('Unit — IMP-11 Design QA + a11y + garde SEO', () => {
  it('le CSS mort .fade-in-scroll a été supprimé et n’est référencé nulle part', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).not.toContain('.fade-in-scroll');
    let references = '';
    try {
      references = execSync('grep -rn "fade-in-scroll" src/ || true', { encoding: 'utf-8' });
    } catch {
      references = '';
    }
    expect(references.trim()).toBe('');
  });

  it('prefers-reduced-motion global : couvre *, animations, transitions et scroll', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain('@media (prefers-reduced-motion: reduce) { *, *::before, *::after {');
    expect(css).toContain('animation-duration: 0.01ms !important');
    expect(css).toContain('transition-duration: 0.01ms !important');
    expect(css).toContain('scroll-behavior: auto !important');
  });

  it('focus-visible global : anneau or visible au clavier', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toMatch(/:focus-visible \{ outline: 3px solid rgba\(184, 149, 42/);
  });

  it('langue du document : <html lang="fr">', async () => {
    const layout = await readFile('src/app/layout.tsx', 'utf-8');
    expect(layout).toContain('<html lang="fr"');
  });

  it('SEO technique : sitemap.ts et robots.ts présents', async () => {
    await expect(access('src/app/sitemap.ts')).resolves.toBeUndefined();
    await expect(access('src/app/robots.ts')).resolves.toBeUndefined();
  });

  it('metadata intacts : exports seoMetadata + generateMetadata des pages publiques', async () => {
    const seo = await readFile('src/lib/seoMetadata.ts', 'utf-8');
    for (const fn of ['export function productMetadata', 'export function looksMetadata', 'export function categoryMetadata', 'export function notFoundMetadata']) {
      expect(seo).toContain(fn);
    }
    const produit = await readFile('src/app/produit/[id]/page.tsx', 'utf-8');
    const looks = await readFile('src/app/looks/page.tsx', 'utf-8');
    expect(produit).toContain('export async function generateMetadata');
    expect(looks).toContain('export async function generateMetadata');
  });

  it('chaîne uploadDate complète : created_at -> createdAt -> VideoObject', async () => {
    const types = await readFile('src/types/index.ts', 'utf-8');
    const svc = await readFile('src/services/publicCatalogService.ts', 'utf-8');
    const page = await readFile('src/app/produit/[id]/product-detail-client.tsx', 'utf-8');
    expect(types).toContain('createdAt?: string;');
    expect(svc).toContain('createdAt: product.created_at,');
    expect(page).toContain('...(product.createdAt ? { uploadDate: product.createdAt } : {})');
  });

  it('JSON-LD produit intact : offers XOF + assainissement safeJsonLd', async () => {
    const page = (await readFile('src/app/produit/[id]/product-detail-client.tsx', 'utf-8')).replace(/\r\n/g, '\n');
    expect(page).toContain('"@type": "Offer"');
    expect(page).toContain('"priceCurrency": "XOF"');
    expect(page).toContain('safeJsonLd(productSchema)');
  });

  it('tokens IMP-01 en place : 6 durées motion + 2 courbes', async () => {
    const css = await readFile('src/app/globals.css', 'utf-8');
    for (const token of ['--motion-micro', '--motion-fast', '--motion-smooth', '--motion-raise', '--motion-reveal', '--motion-entrance', '--ease-out-expo', '--ease-out-luxe']) {
      expect(css).toContain(token);
    }
  });
});
