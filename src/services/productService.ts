// src/services/productService.ts
// ============================================
// Service de gestion des produits (Cadre Final : Synchronisation Inviolable & Zéro Issue)
// ============================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { logSupabaseWarning } from '@/lib/supabaseErrors';
import type { AdminProduct, ProductFormData, ApiResponse } from '@/admin/types';

const USER_ERROR_MSG = 'Une erreur est survenue. Contactez votre administrateur.';


// ============================================
// PERF-05 — Requêtes bornées + cache de session admin.
// Avant : table products entière, re-téléchargée à chaque navigation entre
// les écrans admin (dashboard, produits, stock). Après : fenêtre défensive
// + cache TTL court, invalidé par chaque mutation et par le realtime.
const ADMIN_PRODUCTS_TTL_MS = 30_000;
const ADMIN_PRODUCTS_MAX = 1000; // défensif : ~10x le catalogue réel actuel
let adminProductsCache: { value: AdminProduct[]; expiresAt: number } | null = null;
let adminProductsInFlight: Promise<AdminProduct[]> | null = null;

export function invalidateAdminProductsCache(): void {
  adminProductsCache = null;
}

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  if (adminProductsCache && adminProductsCache.expiresAt > Date.now()) {
    return adminProductsCache.value;
  }
  if (!adminProductsInFlight) {
    adminProductsInFlight = fetchAdminProductsUncached().then((products) => {
      adminProductsCache = { value: products, expiresAt: Date.now() + ADMIN_PRODUCTS_TTL_MS };
      return products;
    }).finally(() => {
      adminProductsInFlight = null;
    });
  }
  return adminProductsInFlight;
}

async function fetchAdminProductsUncached(): Promise<AdminProduct[]> {
  // L’administration doit refléter exclusivement la base partagée.
  if (!isSupabaseConfigured || !supabase) {
    console.warn('Lecture produits indisponible : Supabase non configuré.');
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(ADMIN_PRODUCTS_MAX);

  if (error) {
    logSupabaseWarning('productService', error.message || 'erreur inconnue');
    return [];
  }

  return (data || []) as AdminProduct[];
}

export async function fetchProductById(id: number | string): Promise<AdminProduct | null> {
  const numericId = Number(id);

  if (!supabase) return null;

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', numericId)
    .single();

  if (error || !data) return null;

  return data as AdminProduct;
}

export async function createProduct(formData: ProductFormData): Promise<ApiResponse<AdminProduct>> {
  invalidateAdminProductsCache();
  if (!supabase) {
    return { data: null, error: USER_ERROR_MSG };
  }

  const { data, error } = await supabase
    .from('products')
    .insert([{
      ...formData,
      images: formData.images?.length ? formData.images : (formData.image_url ? [formData.image_url] : []),
      outOfStockSizes: formData.outOfStockSizes || [],
      outOfStockColors: formData.outOfStockColors || [],
      demand: formData.demand || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    const normalized = logSupabaseWarning('product_create', error);
    return { data: null, error: normalized.userMessage };
  }

  return { data: data as AdminProduct, error: null };
}

export async function updateProduct(
  id: number | string,
  formData: Partial<ProductFormData>
): Promise<ApiResponse<AdminProduct>> {
  invalidateAdminProductsCache();
  if (!supabase) {
    return { data: null, error: USER_ERROR_MSG };
  }

  const { data, error } = await supabase
    .from('products')
    .update({
      ...formData,
      updated_at: new Date().toISOString()
    })
    .eq('id', Number(id))
    .select()
    .single();

  if (error) {
    return { data: null, error: USER_ERROR_MSG };
  }

  return { data: data as AdminProduct, error: null };
}

export async function deleteProduct(id: number | string): Promise<ApiResponse<boolean>> {
  invalidateAdminProductsCache();
  if (!supabase) {
    return { data: false, error: USER_ERROR_MSG };
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', Number(id));

  if (error) {
    return { data: false, error: USER_ERROR_MSG };
  }

  return { data: true, error: null };
}
