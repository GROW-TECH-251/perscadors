// src/services/productService.ts
// ============================================
// Service de gestion des produits (Sans message technique)
// ============================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AdminProduct, ProductFormData, ApiResponse } from '@/admin/types';

const USER_ERROR_MSG = 'Une erreur est survenue. Contactez votre administrateur.';

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  if (!isSupabaseConfigured || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch produits:', error);
    return [];
  }

  return (data || []) as AdminProduct[];
}

export async function fetchProductById(id: number | string): Promise<AdminProduct | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', Number(id))
    .single();

  if (error || !data) {
    return null;
  }

  return data as AdminProduct;
}

export async function createProduct(formData: ProductFormData): Promise<ApiResponse<AdminProduct>> {
  if (!supabase) {
    return { data: null, error: USER_ERROR_MSG };
  }

  const { data, error } = await supabase
    .from('products')
    .insert([{
      ...formData,
      demand: formData.demand || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Erreur création produit:', error);
    return { data: null, error: USER_ERROR_MSG };
  }

  return { data: data as AdminProduct, error: null };
}

export async function updateProduct(
  id: number | string,
  formData: Partial<ProductFormData>
): Promise<ApiResponse<AdminProduct>> {
  if (!supabase) {
    return { data: null, error: USER_ERROR_MSG };
  }

  const { data, error } = await supabase
    .from('products')
    .update({
      ...formData,
      updated_at: new Date().toISOString()
    })
    .eq('id', Number(id))
    .select()
    .single();

  if (error) {
    console.error('Erreur update produit:', error);
    return { data: null, error: USER_ERROR_MSG };
  }

  return { data: data as AdminProduct, error: null };
}

export async function deleteProduct(id: number | string): Promise<ApiResponse<boolean>> {
  if (!supabase) {
    return { data: false, error: USER_ERROR_MSG };
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', Number(id));

  if (error) {
    console.error('Erreur suppression produit:', error);
    return { data: false, error: USER_ERROR_MSG };
  }

  return { data: true, error: null };
}
