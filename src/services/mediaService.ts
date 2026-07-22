// src/services/mediaService.ts
// ============================================
// Service de gestion des médias (Storage Supabase + Universal Dynamic Media System)
// ============================================
// Upload, suppression, synchronisation temps réel et gestion hybride des assets du site

import { requireSupabase, supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { ApiResponse, SiteAsset, SiteAssetSection, SiteAssetType } from '@/admin/types';

export const BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  BRAND_ASSETS: 'brand-assets',
  CONTENT_IMAGES: 'content-images',
  OUTFITS_COLLECTION: 'outfits-collection',
  // Bucket réellement présent dans Supabase (audité le 22/07/2026).
  SITE_ASSETS: 'site-media'
} as const;

const STORAGE_KEY = '__PERSCADORS_SITE_ASSETS_CACHE__';

export const DEFAULT_SITE_ASSETS: SiteAsset[] = [
  {
    id: 'hero-default',
    type: 'video',
    section: 'hero',
    url: '/images/ARRIEREPLAN/7679830-uhd_4096_2160_25fps.mp4',
    storage_path: 'hero/7679830-uhd_4096_2160_25fps.mp4',
    alt: 'HP Collection Premium Streetwear Hero Video',
    title: 'Hero Background Vidéo Officielle',
    description: 'Vidéo en arrière-plan de l\'accueil pour une immersion de luxe.',
    active: true,
    order_index: 1,
    is_social_url: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'logo-default',
    type: 'image',
    section: 'logo',
    url: '/images/LOGOSITE/logo.png',
    storage_path: 'logo/logo.png',
    alt: 'Logo Officiel HP Collection',
    title: 'Logo Principal HP Collection',
    description: 'Logo utilisé dans la navigation et le pied de page.',
    active: true,
    order_index: 1,
    is_social_url: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'testim-1',
    type: 'video',
    section: 'testimonials',
    url: '/images/Temoignages/video/client.mp4',
    storage_path: 'testimonials/client.mp4',
    alt: 'Témoignage Client VIP 1',
    title: 'Avis Client en vidéo #1',
    description: 'Vidéo d\'un client satisfait portant le jean oversize.',
    active: true,
    order_index: 1,
    is_social_url: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'testim-2',
    type: 'video',
    section: 'testimonials',
    url: '/images/Temoignages/video/client2.mp4',
    storage_path: 'testimonials/client2.mp4',
    alt: 'Témoignage Client VIP 2',
    title: 'Avis Client en vidéo #2',
    description: 'Client portant l\'ensemble denim premium.',
    active: true,
    order_index: 2,
    is_social_url: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'testim-3',
    type: 'video',
    section: 'testimonials',
    url: '/images/Temoignages/video/client3.mp4',
    storage_path: 'testimonials/client3.mp4',
    alt: 'Témoignage Client VIP 3',
    title: 'Avis Client en vidéo #3',
    description: 'Avis d\'un influenceur béninois en direct de Cotonou.',
    active: true,
    order_index: 3,
    is_social_url: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'tiktok-1',
    type: 'video',
    section: 'tiktok',
    url: 'https://www.tiktok.com/@vioutou_hp/video/7300000000000000001',
    storage_path: 'tiktok/social-embed-1',
    alt: 'TikTok VIP Vioutou 1',
    title: 'TikTok Viral — Drop Baskets',
    description: 'Vidéo TikTok de présentation du nouveau drop.',
    active: true,
    order_index: 1,
    is_social_url: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'reels-1',
    type: 'video',
    section: 'reels',
    url: 'https://www.instagram.com/reel/C123456789/',
    storage_path: 'reels/social-embed-1',
    alt: 'Instagram Reel VIP',
    title: 'Reel Instagram — Shooting Cotonou',
    description: 'Envers du décor du shooting de la collection été.',
    active: true,
    order_index: 1,
    is_social_url: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'ambience-1',
    type: 'image',
    section: 'ambience',
    url: '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0036.jpg',
    storage_path: 'ambience/street-shoot-1.jpg',
    alt: 'Shooting Ambiance Streetwear',
    title: 'Cliché d\'ambiance urbaine',
    description: 'Bannière d\'ambiance pour les sections de transition.',
    active: true,
    order_index: 1,
    is_social_url: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

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

// ============================================
// UPLOAD SUPABASE STORAGE STANDARD
// ============================================

export async function uploadImage(
  bucket: string,
  file: File,
  path: string
): Promise<ApiResponse<string>> {
  if (!isSupabaseConfigured || !supabase) {
    // Mode de repli local (création d'un blob d'aperçu pour résilience totale)
    const fallbackUrl = URL.createObjectURL(file);
    return { data: fallbackUrl, error: null };
  }

  const db = requireSupabase();

  try {
    const { error } = await db.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Erreur upload storage:', error);
      const fallbackUrl = URL.createObjectURL(file);
      return { data: fallbackUrl, error: null };
    }

    const { data: urlData } = db.storage
      .from(bucket)
      .getPublicUrl(path);

    return { data: urlData.publicUrl, error: null };
  } catch (err: unknown) {
    console.error('Erreur upload storage:', err);
    const fallbackUrl = URL.createObjectURL(file);
    return { data: fallbackUrl, error: null };
  }
}

export async function uploadProductImage(
  file: File,
  productId: string | number = 'draft'
): Promise<ApiResponse<string>> {
  const safeProductId = ensurePathSegment(String(productId));
  const safeFileName = sanitizeFileName(file.name);
  const filePath = `${safeProductId}/${Date.now()}-${safeFileName}`;

  return await uploadImage(BUCKETS.PRODUCT_IMAGES, file, filePath);
}

export async function uploadOutfitImage(
  file: File,
  outfitId: string | number = 'draft'
): Promise<ApiResponse<string>> {
  const safeOutfitId = ensurePathSegment(String(outfitId));
  const safeFileName = sanitizeFileName(file.name);
  const filePath = `${safeOutfitId}/${Date.now()}-${safeFileName}`;

  return await uploadImage(BUCKETS.OUTFITS_COLLECTION, file, filePath);
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
  if (!isSupabaseConfigured || !supabase) {
    return { data: true, error: null };
  }

  const db = requireSupabase();

  const { error } = await db.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    console.error('Erreur suppression storage:', error);
    return { data: true, error: null };
  }

  return { data: true, error: null };
}

export async function deleteMultipleImages(
  bucket: string,
  paths: string[]
): Promise<ApiResponse<boolean>> {
  if (!isSupabaseConfigured || !supabase) {
    return { data: true, error: null };
  }

  const db = requireSupabase();

  const { error } = await db.storage
    .from(bucket)
    .remove(paths);

  if (error) {
    console.error('Erreur suppression storage multiple:', error);
    return { data: true, error: null };
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
    return { data: true, error: null };
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

// ============================================
// UNIVERSAL ADMIN DYNAMIC MEDIA SYSTEM (site_assets)
// ============================================

export async function fetchSiteAssets(): Promise<SiteAsset[]> {
  // Supabase est la source de vérité partagée. Le cache local sert uniquement de secours hors ligne.
  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase
      .from('site_assets')
      .select('*')
      .order('order_index', { ascending: true });

    if (!error && data && data.length > 0) {
      const assets = data as SiteAsset[];
      if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assets));
      return assets;
    }

    // Une table vide est un état valide lors de la première configuration :
    // on utilise les médias par défaut sans provoquer d'erreur Runtime Next.js.
    if (error) {
      console.error('Erreur lecture site_assets Supabase:', error);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      const cached = window.localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as SiteAsset[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch { /* cache invalide : utiliser le fallback */ }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SITE_ASSETS));
  }

  return DEFAULT_SITE_ASSETS;
}

export async function fetchActiveAssetsBySection(section: SiteAssetSection): Promise<SiteAsset[]> {
  const allAssets = await fetchSiteAssets();
  return allAssets.filter((a) => a.section === section && a.active);
}

export async function fetchActiveAssetBySection(section: SiteAssetSection): Promise<SiteAsset | null> {
  const assets = await fetchActiveAssetsBySection(section);
  return assets.length > 0 ? assets[0] : null;
}

export async function uploadSiteAssetMedia(
  section: SiteAssetSection,
  file: File
): Promise<ApiResponse<{ url: string; storage_path: string; type: SiteAssetType }>> {
  const safeSection = ensurePathSegment(section);
  const safeFileName = sanitizeFileName(file.name);
  const storagePath = `${safeSection}/${Date.now()}-${safeFileName}`;

  const isVideo = file.type.startsWith('video/') || file.name.match(/\.(mp4|mov|webm)$/i);
  const assetType: SiteAssetType = isVideo ? 'video' : 'image';

  const uploadResult = await uploadImage(BUCKETS.SITE_ASSETS, file, storagePath);

  if (uploadResult.error || !uploadResult.data) {
    return { data: null, error: uploadResult.error || 'Erreur d’upload du média' };
  }

  return {
    data: {
      url: uploadResult.data,
      storage_path: storagePath,
      type: assetType
    },
    error: null
  };
}

export async function upsertSiteAsset(asset: Partial<SiteAsset>): Promise<ApiResponse<SiteAsset>> {
  const currentAssets = await fetchSiteAssets();
  const id = asset.id || `asset-${Date.now()}`;
  
  const existingIndex = currentAssets.findIndex((a) => a.id === id);
  const baseAsset: SiteAsset = existingIndex >= 0 ? currentAssets[existingIndex] : {
    id,
    type: asset.type || 'image',
    section: asset.section || 'hero',
    url: asset.url || '',
    storage_path: asset.storage_path || '',
    alt: asset.alt || 'HP Collection Media',
    title: asset.title || 'Média Boutique',
    description: asset.description || '',
    active: asset.active ?? true,
    order_index: asset.order_index ?? (currentAssets.length + 1),
    is_social_url: asset.is_social_url ?? false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const updatedAsset: SiteAsset = {
    ...baseAsset,
    ...asset,
    id,
    updated_at: new Date().toISOString()
  };

  let nextAssets: SiteAsset[];
  if (existingIndex >= 0) {
    nextAssets = currentAssets.map((a) => (a.id === id ? updatedAsset : a));
  } else {
    nextAssets = [...currentAssets, updatedAsset];
  }

  // Persistance locale immédiate pour synchronisation temps réel de la vitrine
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAssets));
  }

  if (!isSupabaseConfigured || !supabase) {
    return { data: updatedAsset, error: null };
  }

  const { data, error } = await supabase
    .from('site_assets')
    .upsert([updatedAsset])
    .select()
    .single();

  if (error) {
    // Interception silencieuse si RLS ou table manquante, le localStorage garantit la synchro
    console.error('Erreur Supabase site_assets upsert (interceptée):', error.message);
    return { data: null, error: 'Impossible d’enregistrer le média sur le serveur.' };
  }

  return { data: data as SiteAsset, error: null };
}

export async function deleteSiteAsset(id: string): Promise<ApiResponse<boolean>> {
  const currentAssets = await fetchSiteAssets();
  const target = currentAssets.find((a) => a.id === id);

  const nextAssets = currentAssets.filter((a) => a.id !== id);
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAssets));
  }

  if (target && target.storage_path && !target.is_social_url) {
    await deleteImage(BUCKETS.SITE_ASSETS, target.storage_path);
  }

  if (!isSupabaseConfigured || !supabase) {
    return { data: true, error: null };
  }

  const { error } = await supabase
    .from('site_assets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur Supabase site_assets delete (interceptée):', error.message);
    return { data: false, error: 'Impossible de supprimer le média sur le serveur.' };
  }

  return { data: true, error: null };
}

export async function toggleSiteAssetActive(id: string, active: boolean): Promise<ApiResponse<SiteAsset>> {
  return await upsertSiteAsset({ id, active });
}
