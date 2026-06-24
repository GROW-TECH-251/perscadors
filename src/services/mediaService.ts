// src/services/mediaService.ts
// ============================================
// Service de gestion des médias (Storage Supabase)
// ============================================
// Upload, suppression et gestion des images via Supabase Storage

import { requireSupabase, supabase } from '@/lib/supabase';
import type { ApiResponse } from '@/admin/types';

// ============================================
// CONSTANTES
// ============================================

export const BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  BRAND_ASSETS: 'brand-assets',
  CONTENT_IMAGES: 'content-images'
} as const;

// ============================================
// UPLOAD
// ============================================

/**
 * Upload une image vers un bucket Supabase
 */
export async function uploadImage(
  bucket: string,
  file: File,
  path: string
): Promise<ApiResponse<string>> {
  const db = requireSupabase();

  try {
    const { data, error } = await db.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Erreur upload image:', error);
      return { data: null, error: error.message };
    }

    // Récupérer l'URL publique
    const { data: urlData } = db.storage
      .from(bucket)
      .getPublicUrl(path);

    return { data: urlData.publicUrl, error: null };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
    console.error('Erreur upload image:', errorMessage);
    return { data: null, error: errorMessage };
  }
}

/**
 * Upload une image produit
 */
export async function uploadProductImage(
  file: File,
  productId: string
): Promise<ApiResponse<string>> {
  const cleanName = file.name
    .replace(/'/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '')
    .toLowerCase();
  const fileName = `${productId}/${Date.now()}-${cleanName}`;
  return await uploadImage(BUCKETS.PRODUCT_IMAGES, file, fileName);
}

/**
 * Upload un asset de marque (logo, etc.)
 */
export async function uploadBrandAsset(
  file: File,
  assetName: string
): Promise<ApiResponse<string>> {
  const fileName = `${assetName}`;
  return await uploadImage(BUCKETS.BRAND_ASSETS, file, fileName);
}

/**
 * Upload une image de contenu (actualité, blog)
 */
export async function uploadContentImage(
  file: File,
  postId: string
): Promise<ApiResponse<string>> {
  const fileName = `${postId}/${Date.now()}-${file.name}`;
  return await uploadImage(BUCKETS.CONTENT_IMAGES, file, fileName);
}

// ============================================
// SUPPRESSION
// ============================================

/**
 * Supprime une image d'un bucket
 */
export async function deleteImage(
  bucket: string,
  path: string
): Promise<ApiResponse<boolean>> {
  const db = requireSupabase();

  const { error } = await db.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Erreur suppression image:', error);
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}

/**
 * Supprime plusieurs images
 */
export async function deleteMultipleImages(
  bucket: string,
  paths: string[]
): Promise<ApiResponse<boolean>> {
  const db = requireSupabase();

  const { error } = await db.storage
    .from(bucket)
    .remove(paths);

  if (error) {
    console.error('Erreur suppression images multiples:', error);
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}

// ============================================
// URL PUBLIQUE
// ============================================

/**
 * Récupère l'URL publique d'une image
 */
export function getPublicUrl(bucket: string, path: string): string {
  if (!supabase) return '';

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

// ============================================
// COMPRESSION (Optionnel - côté client)
// ============================================

/**
 * Compresse une image avant upload (max 800px)
 */
export async function compressImage(file: File, maxWidth: number = 800): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Erreur compression image'));
            }
          },
          'image/jpeg',
          0.8
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}