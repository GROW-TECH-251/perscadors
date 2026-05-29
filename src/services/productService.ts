// src/services/productService.ts
// ============================================
// Service de gestion des produits
// ============================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { AdminProduct, ProductFormData, ApiResponse } from '@/admin/types';

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

export async function fetchProductById(id: number): Promise<AdminProduct | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return null;
  }

  return data as AdminProduct;
}

export async function createProduct(formData: ProductFormData): Promise<ApiResponse<AdminProduct>> {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  const { data, error } = await supabase
    .from('products')
    .insert([{
      ...formData,
      demand: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as AdminProduct, error: null };
}

export async function updateProduct(
  id: number,
  formData: Partial<ProductFormData>
): Promise<ApiResponse<AdminProduct>> {
  if (!supabase) {
    return { data: null, error: 'Supabase non configuré' };
  }

  const { data, error } = await supabase
    .from('products')
    .update({
      ...formData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as AdminProduct, error: null };
}

export async function deleteProduct(id: number): Promise<ApiResponse<boolean>> {
  if (!supabase) {
    return { data: false, error: 'Supabase non configuré' };
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}