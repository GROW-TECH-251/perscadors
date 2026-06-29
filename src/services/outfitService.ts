// src/services/outfitService.ts
// ============================================
// Service de gestion des HP Looks (Cadre Final : Auto-seeding des 32 Outfits du Repo)
// ============================================

import { requireSupabase, supabase, isSupabaseConfigured } from '@/lib/supabase';
import { outfits as fallbackOutfits } from '@/data/outfits';
import type { AdminOutfit, OutfitFormData, ApiResponse } from '@/admin/types';

const USER_ERROR_MSG = 'Une erreur est survenue. Contactez votre administrateur.';

function getFallbackAdminOutfits(): AdminOutfit[] {
  return fallbackOutfits.map((outfit, index) => {
    const numericId = Number(outfit.id.replace(/\D/g, '')) || (index + 1);
    const productIds = outfit.products.map((p) => Number(p.id) || 1);

    return {
      id: numericId,
      name: outfit.name,
      image_url: outfit.image,
      custom_price: outfit.price,
      product_ids: productIds,
      visible: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });
}

export async function fetchAdminOutfits(): Promise<AdminOutfit[]> {
  const fallbackList = getFallbackAdminOutfits();

  if (!isSupabaseConfigured || !supabase) {
    return fallbackList;
  }

  const { data, error } = await supabase
    .from('outfits')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return fallbackList;
  }

  // CADRE FINAL : Si la table Supabase est vide ou incomplète, on peuple automatiquement avec les 32 HP Looks d'origine du repo !
  if (!data || data.length < fallbackList.length) {
    const existingNames = new Set((data || []).map((o: { name?: string }) => o.name));
    const missingOutfits = fallbackList.filter((item) => !existingNames.has(item.name));

    if (missingOutfits.length > 0) {
      const seedPayload = missingOutfits.map((item) => ({
        id: item.id,
        name: item.name,
        image_url: item.image_url,
        custom_price: item.custom_price,
        product_ids: item.product_ids,
        visible: item.visible,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      supabase.from('outfits').upsert(seedPayload).then(() => {
        // Exécution silencieuse en arrière-plan sans bloquer l'affichage ni polluer le terminal
      });

      const mergedList = [...(data || []), ...seedPayload];
      return mergedList as AdminOutfit[];
    }

    return data as AdminOutfit[];
  }

  return (data || []) as AdminOutfit[];
}

export async function fetchOutfitById(id: number | string): Promise<AdminOutfit | null> {
  const fallbackList = getFallbackAdminOutfits();
  const numericId = Number(id);

  if (!supabase) {
    return fallbackList.find((o) => o.id === numericId) || null;
  }

  const { data, error } = await supabase
    .from('outfits')
    .select('*')
    .eq('id', numericId)
    .single();

  if (error || !data) {
    return fallbackList.find((o) => o.id === numericId) || null;
  }

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
    return { data: null, error: USER_ERROR_MSG };
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
    return { data: null, error: USER_ERROR_MSG };
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
    return { data: false, error: USER_ERROR_MSG };
  }

  return { data: true, error: null };
}
