// src/services/categoryService.ts
// ============================================
// Service de gestion des catégories
// ============================================
// CRUD complet pour les catégories via Supabase

import { requireSupabase, supabase } from '@/lib/supabase';
import type { AdminCategory, ApiResponse } from '@/admin/types';

// ============================================
// LECTURE
// ============================================

/**
 * Récupère toutes les catégories
 */
export async function fetchCategories(): Promise<AdminCategory[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('order', { ascending: true });

  if (error) {
    console.error('Erreur fetch catégories:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère une catégorie par son ID
 */
export async function fetchCategoryById(id: string): Promise<AdminCategory | null> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Erreur fetch catégorie:', error);
    return null;
  }

  return data as AdminCategory;
}

/**
 * Récupère une catégorie par son slug
 */
export async function fetchCategoryBySlug(slug: string): Promise<AdminCategory | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    console.error('Erreur fetch catégorie par slug:', error);
    return null;
  }

  return data as AdminCategory;
}

/**
 * Récupère les catégories visibles
 */
export async function fetchVisibleCategories(): Promise<AdminCategory[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('visible', true)
    .order('order', { ascending: true });

  if (error) {
    console.error('Erreur fetch catégories visibles:', error);
    return [];
  }

  return data || [];
}

// ============================================
// CRÉATION
// ============================================

/**
 * Crée une nouvelle catégorie
 */
export async function createCategory(categoryData: {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  visible: boolean;
  order: number;
}): Promise<ApiResponse<AdminCategory>> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('categories')
    .insert([{
      ...categoryData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Erreur création catégorie:', error);
    return { data: null, error: error.message };
  }

  return { data: data as AdminCategory, error: null };
}

// ============================================
// MISE À JOUR
// ============================================

/**
 * Met à jour une catégorie existante
 */
export async function updateCategory(
  id: string,
  categoryData: Partial<AdminCategory>
): Promise<ApiResponse<AdminCategory>> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('categories')
    .update({
      ...categoryData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour catégorie:', error);
    return { data: null, error: error.message };
  }

  return { data: data as AdminCategory, error: null };
}

// ============================================
// SUPPRESSION
// ============================================

/**
 * Supprime une catégorie
 */
export async function deleteCategory(id: string): Promise<ApiResponse<boolean>> {
  const db = requireSupabase();

  const { error } = await db
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur suppression catégorie:', error);
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Réordonne les catégories
 */
export async function reorderCategories(categoryIds: string[]): Promise<ApiResponse<boolean>> {
  const db = requireSupabase();

  const updates = categoryIds.map((id, index) => ({
    id,
    order: index
  }));

  const { error } = await db
    .from('categories')
    .upsert(updates);

  if (error) {
    console.error('Erreur réordonnancement catégories:', error);
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}