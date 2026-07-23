// src/services/outfitService.ts
// ============================================
// Service de gestion des HP Looks (Cadre Final : Auto-seeding des 32 Outfits du Repo)
// ============================================

import { requireSupabase, supabase, isSupabaseConfigured } from '@/lib/supabase';
import { logSupabaseWarning } from '@/lib/supabaseErrors';
import type { AdminOutfit, OutfitFormData, ApiResponse } from '@/admin/types';

const USER_ERROR_MSG = 'Une erreur est survenue. Contactez votre administrateur.';


export async function fetchAdminOutfits(): Promise<AdminOutfit[]> {
  if (!isSupabaseConfigured || !supabase) {
    console.warn('Lecture HP Looks indisponible : Supabase non configuré.');
    return [];
  }

  const { data, error } = await supabase
    .from('outfits')
    .select('*')
    .order('created_at', { ascending: false });

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
  if (!supabase) {
    return { data: null, error: USER_ERROR_MSG };
  }

  const db = requireSupabase();

  const { data, error } = await db
    .from('outfits')
    .insert([{
      name: formData.name,
      image_url: formData.image_url,
      custom_price: formData.custom_price ?? null,
      product_ids: formData.product_ids || [],
      visible: formData.visible ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

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
  if (!supabase) {
    return { data: null, error: USER_ERROR_MSG };
  }

  const db = requireSupabase();

  const { data, error } = await db
    .from('outfits')
    .update({
      ...formData,
      updated_at: new Date().toISOString()
    })
    .eq('id', Number(id))
    .select()
    .single();

  if (error) {
    const normalized = logSupabaseWarning('outfit_mutation', error);
    return { data: null, error: normalized.userMessage };
  }

  return { data: data as AdminOutfit, error: null };
}

export async function deleteOutfit(id: number | string): Promise<ApiResponse<boolean>> {
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
