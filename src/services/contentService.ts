// src/services/contentService.ts
// ============================================
// Service de gestion du contenu / actualités
// ============================================
// CRUD pour les posts de contenu via Supabase

import { requireSupabase, supabase } from '@/lib/supabase';
import type { ContentPost, ContentPostType, ApiResponse } from '@/admin/types';

// ============================================
// LECTURE
// ============================================

/**
 * Récupère tous les posts de contenu
 */
export async function fetchContentPosts(): Promise<ContentPost[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('content_posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch content posts:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère un post par son ID
 */
export async function fetchContentPostById(id: string): Promise<ContentPost | null> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('content_posts')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Erreur fetch content post:', error);
    return null;
  }

  return data as ContentPost;
}

/**
 * Récupère un post par son slug
 */
export async function fetchContentPostBySlug(slug: string): Promise<ContentPost | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('content_posts')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    console.error('Erreur fetch content post par slug:', error);
    return null;
  }

  return data as ContentPost;
}

/**
 * Récupère les posts publiés
 */
export async function fetchPublishedPosts(): Promise<ContentPost[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('content_posts')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch posts publiés:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère les posts par type
 */
export async function fetchPostsByType(type: ContentPostType): Promise<ContentPost[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('content_posts')
    .select('*')
    .eq('type', type)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch posts par type:', error);
    return [];
  }

  return data || [];
}

// ============================================
// CRÉATION
// ============================================

/**
 * Crée un nouveau post de contenu
 */
export async function createContentPost(postData: {
  title: string;
  slug: string;
  type: ContentPostType;
  content: string;
  excerpt?: string;
  image?: string;
  author: string;
  published: boolean;
  published_at?: string;
}): Promise<ApiResponse<ContentPost>> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('content_posts')
    .insert([{
      ...postData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Erreur création content post:', error);
    return { data: null, error: error.message };
  }

  return { data: data as ContentPost, error: null };
}

// ============================================
// MISE À JOUR
// ============================================

/**
 * Met à jour un post de contenu
 */
export async function updateContentPost(
  id: string,
  postData: Partial<ContentPost>
): Promise<ApiResponse<ContentPost>> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('content_posts')
    .update({
      ...postData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour content post:', error);
    return { data: null, error: error.message };
  }

  return { data: data as ContentPost, error: null };
}

/**
 * Publie ou dépublie un post
 */
export async function togglePostPublication(
  id: string,
  published: boolean
): Promise<ApiResponse<ContentPost>> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('content_posts')
    .update({
      published,
      published_at: published ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur toggle publication post:', error);
    return { data: null, error: error.message };
  }

  return { data: data as ContentPost, error: null };
}

// ============================================
// SUPPRESSION
// ============================================

/**
 * Supprime un post de contenu
 */
export async function deleteContentPost(id: string): Promise<ApiResponse<boolean>> {
  const db = requireSupabase();

  const { error } = await db
    .from('content_posts')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur suppression content post:', error);
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}

// ============================================
// STATISTIQUES
// ============================================

/**
 * Récupère le nombre total de posts
 */
export async function getTotalPostsCount(): Promise<number> {
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from('content_posts')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Erreur count posts:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Récupère le nombre de posts publiés
 */
export async function getPublishedPostsCount(): Promise<number> {
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from('content_posts')
    .select('*', { count: 'exact', head: true })
    .eq('published', true);

  if (error) {
    console.error('Erreur count posts publiés:', error);
    return 0;
  }

  return count || 0;
}