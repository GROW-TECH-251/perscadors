// src/services/settingsService.ts
// ============================================
// Service de gestion des
// ============================================
// CRUD pour shop_settings via Supabase

import { requireSupabase, supabase } from '@/lib/supabase';
import type { ShopSettings, ApiResponse } from '@/admin/types';

// ============================================
// CONSTANTES
// ============================================

const SETTINGS_ROW_ID = 'default';

// ============================================
// LECTURE
// ============================================

/**
 * Récupère les paramètres de la boutique
 */
export async function fetchShopSettings(): Promise<ShopSettings | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('shop_settings')
    .select('*')
    .eq('id', SETTINGS_ROW_ID)
    .single();

  if (error || !data) {
    // Si aucun paramètre n'existe, retourner les valeurs par défaut
    return getDefaultSettings();
  }

  return data as ShopSettings;
}

/**
 * Paramètres par défaut
 */
function getDefaultSettings(): ShopSettings {
  return {
    shop_name: 'HP Collection',
    whatsapp_phone: '22967280018',
    currency: 'FCFA',
    country: 'Bénin',
    delivery_zones: [
      { id: 'cotonou', name: 'Cotonou', fee: 1000, freeThreshold: 50000 },
      { id: 'calavi', name: 'Calavi', fee: 1500, freeThreshold: 60000 },
      { id: 'porto', name: 'Porto-Novo', fee: 2000, freeThreshold: 70000 },
      { id: 'interieur', name: 'Intérieur du pays', fee: 3000, freeThreshold: 100000 }
    ],
    delivery_free_threshold: 50000,
    delivery_time: '24h/48h',
    order_followup_template: 'Bonjour {clientName}, votre commande {orderId} est en attente de validation.',
    order_confirmed_template: 'Bonjour {clientName}, votre commande {orderId} est confirmée. Nous vous contactons pour la livraison.',
    order_delivered_template: 'Bonjour {clientName}, votre commande {orderId} a été livrée. Merci pour votre confiance !',
    customer_segmentation: {
      vip_threshold: 100000,
      loyal_threshold: 3,
      big_cart_threshold: 50000
    },
    logo_url: ''
  };
}

// ============================================
// CRÉATION / MISE À JOUR
// ============================================

/**
 * Crée ou met à jour les paramètres de la boutique
 */
export async function upsertShopSettings(
  settings: Partial<ShopSettings>
): Promise<ApiResponse<ShopSettings>> {
  const db = requireSupabase();

  const existing = await fetchShopSettings();

  if (existing) {
    // Update
    const { data, error } = await db
      .from('shop_settings')
      .update({
        ...existing,
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('id', SETTINGS_ROW_ID)
      .select()
      .single();

    if (error) {
      console.error('Erreur mise à jour shop_settings:', error);
      return { data: null, error: error.message };
    }

    return { data: data as ShopSettings, error: null };
  } else {
    // Insert
    const { data, error } = await db
      .from('shop_settings')
      .insert([{
        id: SETTINGS_ROW_ID,
        shop_name: settings.shop_name || 'HP Collection',
        whatsapp_phone: settings.whatsapp_phone || '22967280018',
        currency: settings.currency || 'FCFA',
        country: settings.country || 'Bénin',
        delivery_zones: settings.delivery_zones || getDefaultSettings().delivery_zones,
        delivery_free_threshold: settings.delivery_free_threshold || 50000,
        delivery_time: settings.delivery_time || '24h/48h',
        order_followup_template: settings.order_followup_template || getDefaultSettings().order_followup_template,
        order_confirmed_template: settings.order_confirmed_template || getDefaultSettings().order_confirmed_template,
        order_delivered_template: settings.order_delivered_template || getDefaultSettings().order_delivered_template,
        customer_segmentation: settings.customer_segmentation || getDefaultSettings().customer_segmentation,
        logo_url: settings.logo_url || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Erreur création shop_settings:', error);
      return { data: null, error: error.message };
    }

    return { data: data as ShopSettings, error: null };
  }
}

/**
 * Met à jour le numéro WhatsApp
 */
export async function updateWhatsAppPhone(phone: string): Promise<ApiResponse<ShopSettings>> {
  return await upsertShopSettings({ whatsapp_phone: phone });
}

/**
 * Met à jour les zones de livraison
 */
export async function updateDeliveryZones(
  zones: ShopSettings['delivery_zones']
): Promise<ApiResponse<ShopSettings>> {
  return await upsertShopSettings({ delivery_zones: zones });
}

/**
 * Met à jour le seuil de livraison gratuite
 */
export async function updateFreeDeliveryThreshold(
  threshold: number
): Promise<ApiResponse<ShopSettings>> {
  return await upsertShopSettings({ delivery_free_threshold: threshold });
}

/**
 * Met à jour les templates WhatsApp
 */
export async function updateWhatsAppTemplates(templates: {
  order_followup_template?: string;
  order_confirmed_template?: string;
  order_delivered_template?: string;
}): Promise<ApiResponse<ShopSettings>> {
  return await upsertShopSettings(templates);
}

/**
 * Met à jour la segmentation client
 */
export async function updateCustomerSegmentation(segmentation: {
  vip_threshold?: number;
  loyal_threshold?: number;
  big_cart_threshold?: number;
}): Promise<ApiResponse<ShopSettings>> {
  const existing = await fetchShopSettings();
  
  const currentSegmentation = existing?.customer_segmentation || {
    vip_threshold: 100000,
    loyal_threshold: 3,
    big_cart_threshold: 50000
  };

  const updatedSegmentation = {
    vip_threshold: segmentation.vip_threshold ?? currentSegmentation.vip_threshold,
    loyal_threshold: segmentation.loyal_threshold ?? currentSegmentation.loyal_threshold,
    big_cart_threshold: segmentation.big_cart_threshold ?? currentSegmentation.big_cart_threshold
  };

  return await upsertShopSettings({ customer_segmentation: updatedSegmentation });
}

/**
 * Met à jour le logo de la boutique
 */
export async function updateShopLogo(logoUrl: string): Promise<ApiResponse<ShopSettings>> {
  return await upsertShopSettings({ logo_url: logoUrl });
}

// ============================================
// UTILITAIRES
// ============================================

/**
 * Calcule les frais de livraison pour une zone et un montant
 */
export function calculateDeliveryFee(
  zoneId: string,
  subtotal: number
): { fee: number; isFree: boolean } {
  const settings = fetchShopSettings();
  
  // En attendant le fetch async, utiliser les valeurs par défaut
  const defaultZones = getDefaultSettings().delivery_zones;
  const zone = defaultZones.find(z => z.id === zoneId);

  if (!zone) {
    return { fee: 0, isFree: false };
  }

  const isFree = subtotal >= zone.freeThreshold;
  return { fee: isFree ? 0 : zone.fee, isFree };
}

/**
 * Formate un message WhatsApp avec les variables
 */
export function formatWhatsAppMessage(
  template: string,
  variables: {
    shopName?: string;
    clientName?: string;
    orderId?: string;
  }
): string {
  let message = template;

  if (variables.shopName) {
    message = message.replace(/{shopName}/g, variables.shopName);
  }
  if (variables.clientName) {
    message = message.replace(/{clientName}/g, variables.clientName);
  }
  if (variables.orderId) {
    message = message.replace(/{orderId}/g, variables.orderId);
  }

  return message;
}