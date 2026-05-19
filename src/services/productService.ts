// src/services/productService.ts
// ============================================
// Service de gestion des produits
// ============================================
// CRUD complet pour les produits via Supabase

import { requireSupabase, supabase } from '@/lib/supabase';
import type { AdminProduct, ProductFormData, ApiResponse } from '@/admin/types';

// ============================================
// LECTURE
// ============================================

/**
 * Récupère tous les produits pour l'admin
 */
export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch produits:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère un produit par son ID
 */
export async function fetchProductById(id: string): Promise<AdminProduct | null> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('products')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Erreur fetch produit:', error);
    return null;
  }

  return data as AdminProduct;
}

/**
 * Récupère les produits visibles pour la vitrine
 */
export async function fetchVisibleProducts(): Promise<AdminProduct[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('visible', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch produits visibles:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère les produits par catégorie
 */
export async function fetchProductsByCategory(category: string): Promise<AdminProduct[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('category', category)
    .eq('visible', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch produits par catégorie:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère les produits en rupture de stock ou stock faible
 */
export async function fetchLowStockProducts(threshold: number = 5): Promise<AdminProduct[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .lte('stock', threshold)
    .eq('visible', true)
    .order('stock', { ascending: true });

  if (error) {
    console.error('Erreur fetch produits stock faible:', error);
    return [];
  }

  return data || [];
}

// ============================================
// CRÉATION
// ============================================

/**
 * Crée un nouveau produit
 */
export async function createProduct(formData: ProductFormData): Promise<ApiResponse<AdminProduct>> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('products')
    .insert([{
      ...formData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Erreur création produit:', error);
    return { data: null, error: error.message };
  }

  return { data: data as AdminProduct, error: null };
}

// ============================================
// MISE À JOUR
// ============================================

/**
 * Met à jour un produit existant
 */
export async function updateProduct(
  id: string,
  formData: Partial<ProductFormData>
): Promise<ApiResponse<AdminProduct>> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('products')
    .update({
      ...formData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour produit:', error);
    return { data: null, error: error.message };
  }

  return { data: data as AdminProduct, error: null };
}

// ============================================
// SUPPRESSION
// ============================================

/**
 * Supprime un produit
 */
export async function deleteProduct(id: string): Promise<ApiResponse<boolean>> {
  const db = requireSupabase();

  const { error } = await db
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur suppression produit:', error);
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}

// ============================================
// RECHERCHE
// ============================================

/**
 * Recherche des produits par query
 */
export async function searchProducts(query: string): Promise<AdminProduct[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .ilike('name', `%${query}%`)
    .eq('visible', true)
    .limit(20);

  if (error) {
    console.error('Erreur recherche produits:', error);
    return [];
  }

  return data || [];
}