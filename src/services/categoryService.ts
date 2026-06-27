// src/services/categoryService.ts
// ============================================
// Service de gestion des catégories
// ============================================
// CRUD complet pour les catégories via Supabase

import { requireSupabase, supabase } from '@/lib/supabase';
import type { AdminCategory, ApiResponse } from '@/admin/types';

export type CategoryFormData = Omit<AdminCategory, 'id' | 'created_at' | 'updated_at'>;

// ============================================
// LECTURE
// ============================================

export async function fetchCategories(): Promise<AdminCategory[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    console.error('Erreur fetch catégories:', error);
    return [];
  }

  return (data || []) as AdminCategory[];
}

export async function fetchCategoryById(id: number | string): Promise<AdminCategory | null> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('categories')
    .select('*')
    .eq('id', Number(id))
    .single();

  if (error || !data) {
    console.error('Erreur fetch catégorie:', error);
    return null;
  }

  return data as AdminCategory;
}

export async function fetchCategoryBySlug(slug: string): Promise<AdminCategory | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('category', slug)
    .single();

  if (error || !data) {
    console.error('Erreur fetch catégorie par slug:', error);
    return null;
  }

  return data as AdminCategory;
}

export async function fetchVisibleCategories(): Promise<AdminCategory[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('visible', true)
    .order('position', { ascending: true });

  if (error) {
    console.error('Erreur fetch catégories visibles:', error);
    return [];
  }

  return (data || []) as AdminCategory[];
}

// ============================================
// CRÉATION
// ============================================

export async function createCategory(categoryData: CategoryFormData): Promise<ApiResponse<AdminCategory>> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('categories')
    .insert([
      {
        ...categoryData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
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

export async function updateCategory(
  id: number | string,
  categoryData: Partial<CategoryFormData>
): Promise<ApiResponse<AdminCategory>> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('categories')
    .update({
      ...categoryData,
      updated_at: new Date().toISOString()
    })
    .eq('id', Number(id))
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

export async function deleteCategory(id: number | string): Promise<ApiResponse<boolean>> {
  const db = requireSupabase();

  const { error } = await db
    .from('categories')
    .delete()
    .eq('id', Number(id));

  if (error) {
    console.error('Erreur suppression catégorie:', error);
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}

// ============================================
// UTILITAIRES
// ============================================

export async function reorderCategories(categoryIds: (number | string)[]): Promise<ApiResponse<boolean>> {
  const db = requireSupabase();

  const updates = categoryIds.map((id, index) => ({
    id: Number(id),
    position: index
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
