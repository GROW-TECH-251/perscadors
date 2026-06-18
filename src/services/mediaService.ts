// src/services/mediaService.ts
// ============================================
// Service de gestion des médias (Storage Supabase)
// ============================================
// Upload, suppression et gestion des images via Supabase Storage

import { requireSupabase, supabase } from '@/lib/supabase';
import type { ApiResponse } from '@/admin/types';

export const BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  BRAND_ASSETS: 'brand-assets',
  CONTENT_IMAGES: 'content-images'
} as const;

function sanitizeFileName(fileName: string): string {
  return fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.-]/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

function ensurePathSegment(value: string): string {
  return value
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

export async function uploadImage(
  bucket: string,
  file: File,
  path: string
): Promise<ApiResponse<string>> {
  const db = requireSupabase();

  try {
    const { error } = await db.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Erreur upload image:', error);
      return { data: null, error: error.message };
    }

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

export async function uploadProductImage(
  file: File,
  productId: string = 'draft'
): Promise<ApiResponse<string>> {
  const safeProductId = ensurePathSegment(productId);
  const safeFileName = sanitizeFileName(file.name);
  const filePath = `${safeProductId}/${Date.now()}-${safeFileName}`;

  return await uploadImage(BUCKETS.PRODUCT_IMAGES, file, filePath);
}

export async function uploadBrandAsset(
  file: File,
  assetName: string
): Promise<ApiResponse<string>> {
  const safeAssetName = `${ensurePathSegment(assetName)}-${Date.now()}-${sanitizeFileName(file.name)}`;
  return await uploadImage(BUCKETS.BRAND_ASSETS, file, safeAssetName);
}

export async function uploadContentImage(
  file: File,
  postId: string = 'draft'
): Promise<ApiResponse<string>> {
  const safePostId = ensurePathSegment(postId);
  const safeFileName = sanitizeFileName(file.name);
  const filePath = `${safePostId}/${Date.now()}-${safeFileName}`;

  return await uploadImage(BUCKETS.CONTENT_IMAGES, file, filePath);
}

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

export function getPublicUrl(bucket: string, path: string): string {
  if (!supabase) return '';

  const { data } = supabase.storage
    .from(bucket)
    .getPublicUrl(path);

  return data.publicUrl;
}

export function extractStoragePathFromUrl(bucket: string, url: string): string | null {
  if (!url) {
    return null;
  }

  const marker = `/${bucket}/`;
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return url.slice(markerIndex + marker.length);
}

export async function deleteImageByUrl(bucket: string, url: string): Promise<ApiResponse<boolean>> {
  const path = extractStoragePathFromUrl(bucket, url);

  if (!path) {
    return { data: false, error: 'Impossible de déterminer le chemin de stockage à partir de l’URL.' };
  }

  return await deleteImage(bucket, path);
}

export async function compressImage(file: File, maxWidth: number = 800): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const image = new Image();
      image.src = event.target?.result as string;

      image.onload = () => {
        const canvas = document.createElement('canvas');
        let width = image.width;
        let height = image.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext('2d');
        context?.drawImage(image, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], sanitizeFileName(file.name), {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Erreur compression image'));
            }
          },
          'image/jpeg',
          0.82
        );
      };

      image.onerror = (error) => reject(error);
    };

    reader.onerror = (error) => reject(error);
  });
}