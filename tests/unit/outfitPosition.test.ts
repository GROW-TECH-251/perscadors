import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { access } from 'fs/promises';

// Phase finale 09/2026 (E1) — ordre d'affichage des HP Looks piloté par
// l'admin : position ASC (nulls last) puis created_at DESC, repli résilient
// si la colonne n'existe pas encore, champ « Ordre d'affichage » dans /admin/hpb.
describe('Unit — E1 Ordre des outfits (position admin)', () => {
  it('service public : ordre position + repli created_at si colonne absente', async () => {
    const svc = await readFile('src/services/publicCatalogService.ts', 'utf-8');
    expect(svc).toContain('async function fetchVisibleOutfitsOrdered(db: SupabaseClient)');
    expect(svc).toContain(".order('position', { ascending: true, nullsFirst: false })");
    // Repli : la requête historique reste la solution de secours exacte.
    const fallbackIdx = svc.indexOf('const legacy = await db');
    expect(fallbackIdx).toBeGreaterThan(-1);
    expect(svc.slice(fallbackIdx, fallbackIdx + 400)).toContain(".order('created_at', { ascending: false })");
    // Les DEUX points de fetch publics utilisent le helper.
    expect(svc.split('fetchVisibleOutfitsOrdered(supabase)').length).toBe(2);
    expect(svc.split('fetchVisibleOutfitsOrdered(client)').length).toBe(2);
  });

  it('types + service admin : position transportée à la création et à l édition', async () => {
    const types = await readFile('src/admin/types.ts', 'utf-8');
    expect(types).toContain('position?: number | null;');
    const svc = await readFile('src/services/outfitService.ts', 'utf-8');
    expect(svc).toContain('position: formData.position ?? null,');
  });

  it('admin/hpb : champ « Ordre d’affichage » présent et inclus au payload', async () => {
    const page = await readFile('src/app/admin/hpb/page.tsx', 'utf-8');
    expect(page).toContain('Ordre d’affichage (1 = premier)');
    expect(page).toContain('value={position}');
    expect(page).toContain("position.trim() === '' ? null : Number(position)");
    expect(page).toContain("setPosition(outfit.position != null ? String(outfit.position) : '')");
  });

  it('la migration SQL existe (colonne + backfill ordre actuel + index)', async () => {
    await access('supabase/migrations/add_outfit_position.sql');
    const sql = await readFile('supabase/migrations/add_outfit_position.sql', 'utf-8');
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS position int');
    expect(sql).toContain('ROW_NUMBER() OVER (ORDER BY created_at DESC)');
    expect(sql).toContain('outfits_visible_position_idx');
  });
});
