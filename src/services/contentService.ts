// src/services/contentService.ts
// ============================================
// Service de gestion du contenu / actualités
// ============================================
// CRUD pour les posts de contenu via Supabase

import { requireSupabase, supabase } from '@/lib/supabase';
import type { ContentPost, ContentPostType, ApiResponse } from '@/admin/types';

export interface ContentPostFormData {
  title: string;
  content: string;
  image_url?: string | null;
  category: ContentPostType;
  status: ContentPost['status'];
  published_at?: string | null;
  scheduled_at?: string | null;
}

function createContentPostId(): string {
  return globalThis.crypto?.randomUUID?.() || `post-${Date.now()}`;
}

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

  return (data || []) as ContentPost[];
}

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

export async function fetchPublishedPosts(): Promise<ContentPost[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('content_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch posts publiés:', error);
    return [];
  }

  return (data || []) as ContentPost[];
}

export async function fetchPostsByType(type: ContentPostType): Promise<ContentPost[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('content_posts')
    .select('*')
    .eq('category', type)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch posts par type:', error);
    return [];
  }

  return (data || []) as ContentPost[];
}

export async function createContentPost(postData: ContentPostFormData): Promise<ApiResponse<ContentPost>> {
  const db = requireSupabase();

  const now = new Date().toISOString();

  const { data, error } = await db
    .from('content_posts')
    .insert([
      {
        id: createContentPostId(),
        title: postData.title,
        content: postData.content,
        image_url: postData.image_url || null,
        category: postData.category,
        status: postData.status,
        published_at: postData.status === 'published' ? postData.published_at || now : null,
        scheduled_at: postData.status === 'scheduled' ? postData.scheduled_at || null : null,
        created_at: now,
        updated_at: now
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Erreur création content post:', error);
    return { data: null, error: error.message };
  }

  return { data: data as ContentPost, error: null };
}

export async function updateContentPost(
  id: string,
  postData: Partial<ContentPostFormData>
): Promise<ApiResponse<ContentPost>> {
  const db = requireSupabase();
  const now = new Date().toISOString();

  const normalizedPayload = {
    ...postData,
    published_at:
      postData.status === 'published'
        ? postData.published_at || now
        : postData.status === 'draft'
          ? null
          : postData.published_at,
    scheduled_at:
      postData.status === 'scheduled'
        ? postData.scheduled_at || null
        : postData.status === 'published' || postData.status === 'draft'
          ? null
          : postData.scheduled_at,
    updated_at: now
  };

  const { data, error } = await db
    .from('content_posts')
    .update(normalizedPayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour content post:', error);
    return { data: null, error: error.message };
  }

  return { data: data as ContentPost, error: null };
}

export async function togglePostPublication(
  id: string,
  nextStatus: ContentPost['status']
): Promise<ApiResponse<ContentPost>> {
  return await updateContentPost(id, {
    status: nextStatus,
    published_at: nextStatus === 'published' ? new Date().toISOString() : null,
    scheduled_at: nextStatus === 'scheduled' ? new Date().toISOString() : null
  });
}

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

export async function getPublishedPostsCount(): Promise<number> {
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from('content_posts')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'published');

  if (error) {
    console.error('Erreur count posts publiés:', error);
    return 0;
  }

  return count || 0;
}