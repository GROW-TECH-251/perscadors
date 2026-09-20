// src/services/outfitService.ts
// ============================================
// Service de gestion des HP Looks (Cadre Final : Auto-seeding des 32 Outfits du Repo)
// ============================================

import { requireSupabase, supabase, isSupabaseConfigured } from '@/lib/supabase';
import { logSupabaseWarning } from '@/lib/supabaseErrors';
import type { AdminOutfit, OutfitFormData, ApiResponse } from '@/admin/types';

const USER_ERROR_MSG = 'Une erreur est survenue. Contactez votre administrateur.';

// IMPL-3 (C3) — prix forfaitaire HP Look. Résilience de déploiement : tant
// que la migration add_outfit_pricing_mode.sql n'est pas exécutée, la colonne
// pricing_mode n'existe pas et Postgres répond 42703 — aucun ordre de
// déploiement n'est imposé entre application et base.
const FLAT_WITHOUT_MIGRATION_MSG =
  'Le prix forfaitaire nécessite la migration Supabase « add_outfit_pricing_mode.sql » (colonne pricing_mode absente de la base). Exécutez-la dans le bon projet Supabase, puis réessayez.';

function isMissingPricingModeColumn(error: unknown): boolean {
  const candidate = error as { code?: string; message?: string } | null;
  if (!candidate) return false;
  if (candidate.code === '42703') return true;
  return /column "pricing_mode" of relation "outfits" does not exist/i.test(String(candidate.message ?? ''));
}


// ============================================
// PERF-05 — Requête bornée + cache de session admin (TTL 60 s, invalidé
// par les mutations — mêmes garanties que categories).
const ADMIN_OUTFITS_TTL_MS = 60_000;
let adminOutfitsCache: { value: AdminOutfit[]; expiresAt: number } | null = null;
let adminOutfitsInFlight: Promise<AdminOutfit[]> | null = null;

export function invalidateAdminOutfitsCache(): void {
  adminOutfitsCache = null;
}

export async function fetchAdminOutfits(): Promise<AdminOutfit[]> {
  if (adminOutfitsCache && adminOutfitsCache.expiresAt > Date.now()) {
    return adminOutfitsCache.value;
  }
  if (!adminOutfitsInFlight) {
    adminOutfitsInFlight = fetchAdminOutfitsUncached().then((outfits) => {
      adminOutfitsCache = { value: outfits, expiresAt: Date.now() + ADMIN_OUTFITS_TTL_MS };
      return outfits;
    }).finally(() => {
      adminOutfitsInFlight = null;
    });
  }
  return adminOutfitsInFlight;
}

async function fetchAdminOutfitsUncached(): Promise<AdminOutfit[]> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('Lecture HP Looks indisponible : Supabase non configuré.');
    return [];
  }

  const { data, error } = await supabase
    .from('outfits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) {
    logSupabaseWarning('outfitService', error.message || 'erreur inconnue');
    return [];
  }

  return (data || []) as AdminOutfit[];
}

export async function fetchOutfitById(id: number | string): Promise<AdminOutfit | null> {
  const numericId = Number(id);

  if (!supabase) return null;

  const { data, error } = await supabase
    .from('outfits')
    .select('*')
    .eq('id', numericId)
    .single();

  if (error || !data) return null;

  return data as AdminOutfit;
}

export async function createOutfit(formData: OutfitFormData): Promise<ApiResponse<AdminOutfit>> {
  invalidateAdminOutfitsCache();
  if (!supabase) {
    return { data: null, error: USER_ERROR_MSG };
  }

  const db = requireSupabase();

  // IMPL-3 (C3) : mode de prix explicite — 'flat' = forfait (référence),
  // 'calculated' = somme des pièces recalculée par le trigger Supabase.
  const row: Record<string, unknown> = {
    name: formData.name,
    image_url: formData.image_url,
    custom_price: formData.custom_price ?? null,
    pricing_mode: formData.pricing_mode ?? 'calculated',
    product_ids: formData.product_ids || [],
    visible: formData.visible ?? true,
    position: formData.position ?? null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  let { data, error } = await db.from('outfits').insert([row]).select().single();

  if (error && isMissingPricingModeColumn(error)) {
    if ((formData.pricing_mode ?? 'calculated') === 'flat') {
      // Jamais de perte silencieuse du forfait : cause expliquée clairement.
      logSupabaseWarning('outfit_mutation_flat_sans_migration', error);
      return { data: null, error: FLAT_WITHOUT_MIGRATION_MSG };
    }
    // Mode calculé : repli historique strictement identique (somme trigger).
    logSupabaseWarning('outfit_mutation_repli_historique', error);
    const legacyRow = { ...row };
    delete legacyRow.pricing_mode;
    ({ data, error } = await db.from('outfits').insert([legacyRow]).select().single());
  }

  if (error) {
    const normalized = logSupabaseWarning('outfit_mutation', error);
    return { data: null, error: normalized.userMessage };
  }

  return { data: data as AdminOutfit, error: null };
}

export async function updateOutfit(
  id: number | string,
  formData: Partial<OutfitFormData>
): Promise<ApiResponse<AdminOutfit>> {
  invalidateAdminOutfitsCache();
  if (!supabase) {
    return { data: null, error: USER_ERROR_MSG };
  }

  const db = requireSupabase();

  const payload: Record<string, unknown> = {
    ...formData,
    updated_at: new Date().toISOString()
  };

  let { data, error } = await db.from('outfits').update(payload).eq('id', Number(id)).select().single();

  if (error && isMissingPricingModeColumn(error)) {
    if (formData.pricing_mode === 'flat') {
      logSupabaseWarning('outfit_mutation_flat_sans_migration', error);
      return { data: null, error: FLAT_WITHOUT_MIGRATION_MSG };
    }
    logSupabaseWarning('outfit_mutation_repli_historique', error);
    const legacyPayload = { ...payload };
    delete legacyPayload.pricing_mode;
    ({ data, error } = await db.from('outfits').update(legacyPayload).eq('id', Number(id)).select().single());
  }

  if (error) {
    const normalized = logSupabaseWarning('outfit_mutation', error);
    return { data: null, error: normalized.userMessage };
  }

  return { data: data as AdminOutfit, error: null };
}

export async function deleteOutfit(id: number | string): Promise<ApiResponse<boolean>> {
  invalidateAdminOutfitsCache();
  if (!supabase) {
    return { data: false, error: USER_ERROR_MSG };
  }

  const db = requireSupabase();

  const { error } = await db
    .from('outfits')
    .delete()
    .eq('id', Number(id));

  if (error) {
    const normalized = logSupabaseWarning('outfit_delete', error);
    return { data: false, error: normalized.userMessage };
  }

  return { data: true, error: null };
}
