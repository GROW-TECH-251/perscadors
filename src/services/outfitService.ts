// src/services/outfitService.ts
// ============================================
// Service de gestion des HP Looks (Module HPB)
// ============================================

import { requireSupabase, supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AdminOutfit, OutfitFormData, ApiResponse } from '@/admin/types';

export async function fetchAdminOutfits(): Promise<AdminOutfit[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('outfits')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch outfits:', error);
    return [];
  }

  return (data || []) as AdminOutfit[];
}

export async function fetchOutfitById(id: number | string): Promise<AdminOutfit | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('outfits')
    .select('*')
    .eq('id', Number(id))
    .single();

  if (error || !data) {
    console.error('Erreur fetch outfit:', error);
    return null;
  }

  return data as AdminOutfit;
}

export async function createOutfit(formData: OutfitFormData): Promise<ApiResponse<AdminOutfit>> {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
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
    console.error('Erreur création outfit:', error);
    return { data: null, error: error.message };
  }

  return { data: data as AdminOutfit, error: null };
}

export async function updateOutfit(
  id: number | string,
  formData: Partial<OutfitFormData>
): Promise<ApiResponse<AdminOutfit>> {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
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
    console.error('Erreur mise à jour outfit:', error);
    return { data: null, error: error.message };
  }

  return { data: data as AdminOutfit, error: null };
}

export async function deleteOutfit(id: number | string): Promise<ApiResponse<boolean>> {
  if (!supabase) {
    return { data: false, error: 'Supabase non configuré' };
  }

  const db = requireSupabase();

  const { error } = await db
    .from('outfits')
    .delete()
    .eq('id', Number(id));

  if (error) {
    console.error('Erreur suppression outfit:', error);
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}
