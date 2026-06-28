// src/services/productService.ts
// ============================================
// Service de gestion des produits (Cadre Final : Synchronisation Intelligente & Auto-Seeding)
// ============================================

import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { products as fallbackProducts } from '@/data/products';
import type { AdminProduct, ProductFormData, ApiResponse } from '@/admin/types';

const USER_ERROR_MSG = 'Une erreur est survenue. Contactez votre administrateur.';

function getFallbackAdminProducts(): AdminProduct[] {
  return fallbackProducts.map((product, index) => {
    // Conversion d'id textuel (ex: 'basket-1') en ID numérique strict pour Supabase
    const numericId = Number(product.id.replace(/\D/g, '')) || (index + 1);
    const primaryImage = (product as unknown as { image_url?: string }).image_url || product.images[0] || '/images/LOGOSITE/logo.png';

    return {
      id: numericId,
      name: product.name,
      category: product.category,
      price: product.price,
      image_url: primaryImage,
      images: product.images?.length ? product.images : [primaryImage],
      sizes: product.sizes || [],
      colors: product.colors || [],
      outOfStockSizes: product.outOfStockSizes || [],
      outOfStockColors: product.outOfStockColors || [],
      demand: product.isPopular ? 25 : 10,
      stock: product.inStock ? 50 : 0,
      badge: product.isPopular ? 'Populaire' : null,
      description: product.description || 'Produit premium HP Collection.',
      visible: true,
      slug: product.slug || product.id,
      isPopular: Boolean(product.isPopular),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  });
}

export async function fetchAdminProducts(): Promise<AdminProduct[]> {
  const fallbackList = getFallbackAdminProducts();

  if (!isSupabaseConfigured || !supabase) {
    return fallbackList;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch produits:', error);
    return fallbackList;
  }

  // CADRE FINAL : Synchronisation Intelligente (Merge & Auto-Seeding)
  // Si la table Supabase contient moins de produits que le catalogue d'origine (ex: juste 1 produit de test),
  // on peuple automatiquement les articles manquants en arrière-plan et on affiche la liste fusionnée instantanément !
  if (!data || data.length < fallbackList.length) {
    console.log('Catalogue Supabase incomplet ou vide : Injection automatique des articles d’origine du repo...');
    
    const existingNames = new Set((data || []).map((p: { name?: string }) => p.name));
    const missingProducts = fallbackList.filter((item) => !existingNames.has(item.name));

    if (missingProducts.length > 0) {
      // Auto-seeding asynchrone en arrière-plan sans bloquer l'affichage ni polluer le terminal
      const seedPayload = missingProducts.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        image_url: item.image_url,
        sizes: item.sizes,
        colors: item.colors,
        demand: item.demand,
        stock: item.stock,
        badge: item.badge,
        description: item.description,
        visible: item.visible,
        created_at: item.created_at,
        updated_at: item.updated_at
      }));

      supabase.from('products').upsert(seedPayload).then(() => {
        // Exécution silencieuse
      });
    }

    // On retourne la liste fusionnée complète instantanément à l'écran !
    const mergedList = [...(data || []), ...missingProducts];
    return mergedList as AdminProduct[];
  }

  return (data || []) as AdminProduct[];
}

export async function fetchProductById(id: number | string): Promise<AdminProduct | null> {
  const fallbackList = getFallbackAdminProducts();
  const numericId = Number(id);

  if (!supabase) {
    return fallbackList.find((p) => p.id === numericId) || null;
  }

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', numericId)
    .single();

  if (error || !data) {
    return fallbackList.find((p) => p.id === numericId) || null;
  }

  return data as AdminProduct;
}

export async function createProduct(formData: ProductFormData): Promise<ApiResponse<AdminProduct>> {
  if (!supabase) {
    return { data: null, error: USER_ERROR_MSG };
  }

  const { data, error } = await supabase
    .from('products')
    .insert([{
      ...formData,
      demand: formData.demand || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select()
    .single();

  if (error) {
    console.error('Erreur création produit:', error);
    return { data: null, error: USER_ERROR_MSG };
  }

  return { data: data as AdminProduct, error: null };
}

export async function updateProduct(
  id: number | string,
  formData: Partial<ProductFormData>
): Promise<ApiResponse<AdminProduct>> {
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
    console.error('Erreur update produit:', error);
    return { data: null, error: USER_ERROR_MSG };
  }

  return { data: data as AdminProduct, error: null };
}

export async function deleteProduct(id: number | string): Promise<ApiResponse<boolean>> {
  if (!supabase) {
    return { data: false, error: USER_ERROR_MSG };
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', Number(id));

  if (error) {
    console.error('Erreur suppression produit:', error);
    return { data: false, error: USER_ERROR_MSG };
  }

  return { data: true, error: null };
}
