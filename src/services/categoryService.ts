// src/services/categoryService.ts
// ============================================
// Service de gestion des catégories (Sans message technique)
// ============================================

import { requireSupabase, supabase } from '@/lib/supabase';
import { logSupabaseWarning } from '@/lib/supabaseErrors';
import type { AdminCategory, ApiResponse } from '@/admin/types';

export type CategoryFormData = Omit<AdminCategory, 'id' | 'created_at' | 'updated_at'>;

const USER_ERROR_MSG = 'Une erreur est survenue. Contactez votre administrateur.';

export async function fetchCategories(): Promise<AdminCategory[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    logSupabaseWarning('categoryService', error);
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
    logSupabaseWarning('categoryService', error);
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
    logSupabaseWarning('categoryService', error);
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
    logSupabaseWarning('categoryService', error);
    return [];
  }

  return (data || []) as AdminCategory[];
}

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
    logSupabaseWarning('categoryService', error);
    return { data: null, error: USER_ERROR_MSG };
  }

  return { data: data as AdminCategory, error: null };
}

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
    logSupabaseWarning('categoryService', error);
    return { data: null, error: USER_ERROR_MSG };
  }

  return { data: data as AdminCategory, error: null };
}

export async function deleteCategory(id: number | string): Promise<ApiResponse<boolean>> {
  const db = requireSupabase();

  const { error } = await db
    .from('categories')
    .delete()
    .eq('id', Number(id));

  if (error) {
    logSupabaseWarning('categoryService', error);
    return { data: false, error: USER_ERROR_MSG };
  }

  return { data: true, error: null };
}

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
    logSupabaseWarning('categoryService', error);
    return { data: false, error: USER_ERROR_MSG };
  }

  return { data: true, error: null };
}
