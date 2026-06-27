// src/services/settingsService.ts
// ============================================
// Service de gestion des réglages boutique
// ============================================

import { requireSupabase, supabase } from '@/lib/supabase';
import type { ShopSettings, ApiResponse, DeliveryZone, CustomerSegmentationSettings } from '@/admin/types';

const SETTINGS_ROW_ID = 'default';

const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'cotonou', name: 'Cotonou', fee: 1000, freeThreshold: 50000 },
  { id: 'calavi', name: 'Calavi', fee: 1500, freeThreshold: 60000 },
  { id: 'porto-novo', name: 'Porto-Novo', fee: 2000, freeThreshold: 70000 },
  { id: 'interieur', name: 'Intérieur du pays', fee: 3000, freeThreshold: 100000 }
];

const DEFAULT_SEGMENTATION: CustomerSegmentationSettings = {
  vip_threshold: 100000,
  loyal_threshold: 3,
  big_cart_threshold: 50000
};

function getCurrentIsoDate(): string {
  return new Date().toISOString();
}

export function getDefaultShopSettings(): ShopSettings {
  return {
    shop_name: 'HP Collection',
    whatsapp_phone: '22967280018',
    driver_phone: '',
    currency: 'FCFA',
    country: 'Bénin',
    delivery_zones: DEFAULT_DELIVERY_ZONES,
    delivery_free_threshold: 50000,
    delivery_time: '24h/48h',
    order_followup_template: 'Bonjour {clientName}, votre commande {orderId} est en attente de validation.',
    order_confirmed_template: 'Bonjour {clientName}, votre commande {orderId} est confirmée. Nous vous contactons pour la livraison.',
    order_delivered_template: 'Bonjour {clientName}, votre commande {orderId} a été livrée. Merci pour votre confiance !',
    story_share_template: '🔥 *BEST-SELLER {shopName}* 🔥\n\nDécouvrez notre pièce la plus prisée : *{productName}* à seulement *{productPrice}*.\n\n👑 _Vioutou t\'habille. Tu règnes._\n👉 Réservez votre taille directement ici : https://hpcollection.bj',
    vip_magic_template: '👑 *{shopName} — OFFRE SECRÈTE VIP* 👑\n\nSalut {clientName} ! Ça fait un moment qu\'on n\'a pas vu ton élégance dans nos commandes.\n\nVioutou t\'a sélectionné une pièce exclusive de notre nouvel arrivage avec un code promo secret : *{couponCode}* (-10% sur ton prochain panier).\n\n👉 Découvre les nouveautés ici : https://hpcollection.bj\n\n_Réponds directement à ce message pour réserver ta taille avant la rupture ! 🚀_',
    driver_dispatch_template: '🚀 *MISSION LIVRAISON {shopName}* 🚀\n\n📦 *Réf Commande :* {orderId}\n👤 *Client :* {clientName}\n📱 *Contact :* {clientPhone}\n📍 *Lieu de livraison :* {clientArea}\n\n🛒 *Articles à remettre au client :*\n{itemsList}\n\n💰 *Montant net à encaisser :* {orderTotal}\n\n_Merci de confirmer la bonne réception de cette mission et d\'entamer la livraison._',
    customer_segmentation: DEFAULT_SEGMENTATION,
    logo_url: '',
    updated_at: getCurrentIsoDate()
  };
}

function normalizeDeliveryZones(value: unknown): DeliveryZone[] {
  if (!Array.isArray(value)) {
    return DEFAULT_DELIVERY_ZONES;
  }

  return value
    .map((zone, index) => {
      if (!zone || typeof zone !== 'object') {
        return null;
      }

      const candidate = zone as Partial<DeliveryZone>;
      return {
        id: candidate.id || `zone-${index + 1}`,
        name: candidate.name || `Zone ${index + 1}`,
        fee: Number(candidate.fee || 0),
        freeThreshold: Number(candidate.freeThreshold || 0)
      } satisfies DeliveryZone;
    })
    .filter((zone): zone is DeliveryZone => zone !== null);
}

function normalizeSegmentation(value: unknown): CustomerSegmentationSettings {
  if (!value || typeof value !== 'object') {
    return DEFAULT_SEGMENTATION;
  }

  const candidate = value as Partial<CustomerSegmentationSettings>;
  return {
    vip_threshold: Number(candidate.vip_threshold ?? DEFAULT_SEGMENTATION.vip_threshold),
    loyal_threshold: Number(candidate.loyal_threshold ?? DEFAULT_SEGMENTATION.loyal_threshold),
    big_cart_threshold: Number(candidate.big_cart_threshold ?? DEFAULT_SEGMENTATION.big_cart_threshold)
  };
}

function normalizeShopSettings(rawSettings: Partial<ShopSettings> | null | undefined): ShopSettings {
  const defaults = getDefaultShopSettings();

  return {
    shop_name: rawSettings?.shop_name || defaults.shop_name,
    whatsapp_phone: rawSettings?.whatsapp_phone || defaults.whatsapp_phone,
    driver_phone: rawSettings?.driver_phone || defaults.driver_phone,
    currency: rawSettings?.currency || defaults.currency,
    country: rawSettings?.country || defaults.country,
    delivery_zones: normalizeDeliveryZones(rawSettings?.delivery_zones),
    delivery_free_threshold: Number(rawSettings?.delivery_free_threshold ?? defaults.delivery_free_threshold),
    delivery_time: rawSettings?.delivery_time || defaults.delivery_time,
    order_followup_template: rawSettings?.order_followup_template || defaults.order_followup_template,
    order_confirmed_template: rawSettings?.order_confirmed_template || defaults.order_confirmed_template,
    order_delivered_template: rawSettings?.order_delivered_template || defaults.order_delivered_template,
    story_share_template: rawSettings?.story_share_template || defaults.story_share_template,
    vip_magic_template: rawSettings?.vip_magic_template || defaults.vip_magic_template,
    driver_dispatch_template: rawSettings?.driver_dispatch_template || defaults.driver_dispatch_template,
    customer_segmentation: normalizeSegmentation(rawSettings?.customer_segmentation),
    logo_url: rawSettings?.logo_url || '',
    updated_at: rawSettings?.updated_at || defaults.updated_at
  };
}

export async function fetchShopSettings(): Promise<ShopSettings | null> {
  if (!supabase) {
    return getDefaultShopSettings();
  }

  const { data, error } = await supabase
    .from('shop_settings')
    .select('*')
    .eq('id', SETTINGS_ROW_ID)
    .single();

  if (error || !data) {
    return getDefaultShopSettings();
  }

  return normalizeShopSettings(data as Partial<ShopSettings>);
}

export async function upsertShopSettings(
  settings: Partial<ShopSettings>
): Promise<ApiResponse<ShopSettings>> {
  if (!supabase) {
    return {
      data: null,
      error: 'Supabase non configuré'
    };
  }

  const db = requireSupabase();
  const existingSettings = await fetchShopSettings();
  const nextSettings = normalizeShopSettings({
    ...existingSettings,
    ...settings,
    updated_at: getCurrentIsoDate()
  });

  const payload = {
    id: SETTINGS_ROW_ID,
    ...nextSettings
  };

  const { data, error } = await db
    .from('shop_settings')
    .upsert(payload)
    .select()
    .single();

  if (error) {
    console.error('Erreur sauvegarde shop_settings:', error);
    return { data: null, error: error.message };
  }

  return { data: normalizeShopSettings(data as Partial<ShopSettings>), error: null };
}

export async function updateWhatsAppPhone(phone: string): Promise<ApiResponse<ShopSettings>> {
  return await upsertShopSettings({ whatsapp_phone: phone });
}

export async function updateDeliveryZones(
  zones: ShopSettings['delivery_zones']
): Promise<ApiResponse<ShopSettings>> {
  return await upsertShopSettings({ delivery_zones: zones });
}

export async function updateFreeDeliveryThreshold(
  threshold: number
): Promise<ApiResponse<ShopSettings>> {
  return await upsertShopSettings({ delivery_free_threshold: threshold });
}

export async function updateWhatsAppTemplates(templates: {
  order_followup_template?: string;
  order_confirmed_template?: string;
  order_delivered_template?: string;
  story_share_template?: string;
  vip_magic_template?: string;
  driver_dispatch_template?: string;
}): Promise<ApiResponse<ShopSettings>> {
  return await upsertShopSettings(templates);
}

export async function updateCustomerSegmentation(segmentation: Partial<CustomerSegmentationSettings>): Promise<ApiResponse<ShopSettings>> {
  const existingSettings = await fetchShopSettings();

  return await upsertShopSettings({
    customer_segmentation: {
      ...normalizeSegmentation(existingSettings?.customer_segmentation),
      ...segmentation
    }
  });
}

export async function updateShopLogo(logoUrl: string): Promise<ApiResponse<ShopSettings>> {
  return await upsertShopSettings({ logo_url: logoUrl });
}

export function calculateDeliveryFee(
  zoneId: string,
  subtotal: number,
  settings?: ShopSettings | null
): { fee: number; isFree: boolean } {
  const deliveryZones = settings?.delivery_zones || DEFAULT_DELIVERY_ZONES;
  const zone = deliveryZones.find((deliveryZone) => deliveryZone.id === zoneId);

  if (!zone) {
    return { fee: 0, isFree: false };
  }

  const isFree = subtotal >= zone.freeThreshold;
  return { fee: isFree ? 0 : zone.fee, isFree };
}

export function formatWhatsAppMessage(
  template: string,
  variables: {
    shopName?: string;
    clientName?: string;
    orderId?: string;
    productName?: string;
    productPrice?: string;
    clientPhone?: string;
    clientArea?: string;
    itemsList?: string;
    orderTotal?: string;
    couponCode?: string;
  }
): string {
  let message = template;

  if (variables.shopName) message = message.replace(/{shopName}/g, variables.shopName);
  if (variables.clientName) message = message.replace(/{clientName}/g, variables.clientName);
  if (variables.orderId) message = message.replace(/{orderId}/g, variables.orderId);
  if (variables.productName) message = message.replace(/{productName}/g, variables.productName);
  if (variables.productPrice) message = message.replace(/{productPrice}/g, variables.productPrice);
  if (variables.clientPhone) message = message.replace(/{clientPhone}/g, variables.clientPhone);
  if (variables.clientArea) message = message.replace(/{clientArea}/g, variables.clientArea);
  if (variables.itemsList) message = message.replace(/{itemsList}/g, variables.itemsList);
  if (variables.orderTotal) message = message.replace(/{orderTotal}/g, variables.orderTotal);
  if (variables.couponCode) message = message.replace(/{couponCode}/g, variables.couponCode);

  return message;
}
