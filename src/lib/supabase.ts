// src/lib/supabase.ts
// ============================================
// Configuration Supabase (avec Storage)
// ============================================

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || process.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error('Supabase n\'est pas configuré.');
  }
  return supabase;
}

// ============================================
// UPLOAD D'IMAGES
// ============================================

export async function uploadProductImage(file: File, productId?: string): Promise<{ url: string; error?: string }> {
  if (!supabase) {
    return { url: '', error: 'Supabase non configuré' };
  }

  try {
    const fileName = `${productId || 'new'}-${Date.now()}-${file.name.replace(/\s/g, '-')}`;
    
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return { url: urlData.publicUrl };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur upload';
    return { url: '', error: errorMessage };
  }
}

export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  if (!supabase) return false;

  try {
    const fileName = imageUrl.split('/').pop();
    if (!fileName) return false;

    await supabase.storage
      .from('product-images')
      .remove([fileName]);

    return true;
  } catch (err) {
    console.error('Erreur suppression image:', err);
    return false;
  }
}