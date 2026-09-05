// src/services/settingsService.ts
// ============================================
// Service de gestion des réglages boutique (Résilience 100%, LocalStorage Sync & Zéro Issue)
// ============================================

import { requireSupabase, supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { logSupabaseWarning } from '@/lib/supabaseErrors';
import type { ShopSettings, ApiResponse, DeliveryZone, CustomerSegmentationSettings, TestimonialsData, FAQItem } from '@/admin/types';

const SETTINGS_ROW_ID = true;
const SETTINGS_CACHE_KEY = '__PERSCADORS_SETTINGS_PERSISTENCE__';

const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'cotonou', name: 'Cotonou', fee: 1000 },
  { id: 'calavi', name: 'Abomey-Calavi', fee: 1500 },
  { id: 'porto-novo', name: 'Porto-Novo', fee: 2000 },
  { id: 'interieur', name: 'Intérieur du pays', fee: 3000 }
];

const DEFAULT_SEGMENTATION: CustomerSegmentationSettings = {
  vip_threshold: 100000,
  loyal_threshold: 3,
  big_cart_threshold: 50000
};

const DEFAULT_TESTIMONIALS: TestimonialsData = {
  // Volontairement vide : aucune capture n'est fournie par défaut. L'ancienne
  // valeur pointait vers /assets/testimonials/photos/témoignageclient.jpeg,
  // un fichier inexistant (le dossier ne contient que video/), ce qui
  // produisait une image cassée en vitrine.
  screenshot_url: '',
  screenshot_quote: "Tu connais #HPcollection c'est la meilleure prêt à porter du Bénin 🇧🇯 actuellement chez Honoré Perscadors...",
  videos: [
    { src: '/assets/testimonials/video/client.mp4', title: 'Avis Client #1', description: 'Validation de l\'outfit complet par un king local.' },
    { src: '/assets/testimonials/video/client2.mp4', title: 'Avis Client #2', description: 'Review des baskets premium à la réception.' },
    { src: '/assets/testimonials/video/client3.mp4', title: 'Avis Client #3', description: 'Un look validé à 100% sur Cotonou.' }
  ]
};

const DEFAULT_FAQ: FAQItem[] = [
  { question: 'Comment commander ?', answer: 'Choisissez votre article, sélectionnez votre taille et couleur, puis cliquez sur "Deal avec Vioutou". WhatsApp s\'ouvre automatiquement avec votre commande prête.' },
  { question: 'Vous livrez où ?', answer: 'Nous livrons partout au Bénin.' },
  { question: 'Quels sont les délais de livraison ?', answer: '24 à 48h après confirmation de votre commande.' },
  { question: 'Comment choisir ma taille ?', answer: 'Chaque produit a un guide de tailles disponible. En cas de doute, contactez Vioutou directement sur WhatsApp.' },
  { question: 'Est-ce que je peux échanger un article ?', answer: 'Oui, les échanges sont possibles sous 48h après réception. Contactez-nous sur WhatsApp.' },
  { question: 'Comment connaître le prix d\'un article ?', answer: 'Le prix est affiché directement sur chaque produit. Pour plus d\'infos contactez Vioutou sur WhatsApp.' }
];

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
    delivery_time: '24h/48h',
    checkout_order_template: 'Bonjour 👋\n\nVoici une nouvelle commande à préparer\n\nRéférence : {orderId}\nClient : {clientName}\nTéléphone : {clientPhone}\nVille : {clientArea}\n\nArticles\n{itemsList}\nSous-total : {orderSubtotal}\nFrais de livraison : à confirmer\nTotal des articles : {orderTotal}\n\nMerci, on confirme les détails ensemble sur WhatsApp 🙂',
    order_followup_template: 'Bonjour {clientName} 👋\n\nVotre commande {orderId} attend votre confirmation. Écrivez-nous si vous avez une question 🙂',
    order_confirmed_template: 'Bonjour {clientName} 👋\n\nVotre commande {orderId} est confirmée. Nous vous écrivons bientôt pour organiser la livraison 🚚',
    order_delivered_template: 'Bonjour {clientName} 👋\n\nVotre commande {orderId} a bien été livrée. Merci pour votre confiance 🙂',
    story_share_template: '✨ {productName}\n\n{productPrice} chez {shopName}\n\nÉcrivez-nous pour réserver votre taille 🙂',
    vip_magic_template: 'Bonjour {clientName} 👋\n\nDe nouvelles pièces viennent d’arriver chez {shopName}.\n\nPour vous, le code {couponCode} est disponible sur votre prochaine commande.\n\nDécouvrez-les ici : https://hpcollection.bj',
    product_share_template: 'Bonjour {clientName} 👋\n\n✨ {productName}\nPrix : {productPrice}\n\nÉcrivez-moi si vous souhaitez réserver votre taille 🙂',
    outfit_share_template: 'Bonjour {clientName} 👋\n\n✨ {lookName}\nPrix : {lookPrice}\n\nJe peux vous réserver les pièces disponibles si vous le souhaitez 🙂',
    content_share_template: 'Bonjour {clientName} 👋\n\n{contentTitle}\n\n{contentMessage}\n\nÉcrivez-nous si vous souhaitez en savoir plus 🙂',
    customer_relaunch_template: 'Bonjour {clientName} 👋\nOn a pensé à toi chez {shopName}. De nouvelles pièces sont disponibles cette semaine.',
    driver_dispatch_template: 'Bonjour 👋\n\nLivraison à organiser pour {shopName}\n\nRéférence : {orderId}\nClient : {clientName}\nTéléphone : {clientPhone}\nVille : {clientArea}\n\nArticles\n{itemsList}\nMontant à encaisser : {orderTotal}\n\nMerci de confirmer la prise en charge 🙂',
    customer_segmentation: DEFAULT_SEGMENTATION,
    logo_url: '',
    hero_title: 'Vioutou t\'habille. Tu règnes.',
    hero_subtitle: 'La marque de mode streetwear premium. Statut, style, modernité et une élégance sans compromis. Impose ta présence dans la rue.',
    hero_video_url: '/assets/backgrounds/hero-1080p.mp4', // PERF-01 : variante 6,5 Mo (l'ancienne 4K de 36 Mo est mappée par Hero.tsx)
    footer_description: 'La marque de mode streetwear premium au Bénin. Statut, style, modernité et une élégance sans compromis.',
    floating_whatsapp_text: 'Bonjour Vioutou ! Je viens du site HP Collection et j\'aimerais discuter de vos outfits.',
    social_title: 'HP Collection | Boutique Streetwear Premium',
    social_description: 'Découvrez la sélection streetwear premium HP Collection.',
    social_image_url: '/assets/collections/articles/BASKET POUR HOMME/IMG-20251014-WA0036.jpg',
    testimonials_json: DEFAULT_TESTIMONIALS,
    faq_json: DEFAULT_FAQ,
    updated_at: getCurrentIsoDate()
  };
}

// CORRECTION CAPITALE DES TEMPLATES COUPÉS EN BASE DE DONNÉES
function normalizeTemplate(rawTemplate: string | null | undefined, defaultTemplate: string): string {
  if (!rawTemplate || rawTemplate.trim() === '') {
    return defaultTemplate;
  }
  // SI LE TEXTE EN BASE A ÉTÉ TRONQUÉ AVEC LES POINTS DE SUSPENSION (...) PAR LE SCRIPT SQL SUPABASE, ON RESTAURE LA VERSION COMPLÈTE !
  if (rawTemplate.includes('...') || rawTemplate.endsWith('...')) {
    return defaultTemplate;
  }
  return rawTemplate;
}

function getReadableCityName(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const candidate = value.trim();
  if (!candidate) return fallback;

  // Anciennes données parfois sérialisées dans une chaîne JSON : ne jamais
  // afficher cette structure technique telle quelle au marchand.
  if (candidate.startsWith('{') || candidate.startsWith('[')) {
    try {
      const parsed = JSON.parse(candidate) as { name?: unknown; city?: unknown; label?: unknown };
      const parsedName = parsed.name || parsed.city || parsed.label;
      return typeof parsedName === 'string' && parsedName.trim() ? parsedName.trim() : fallback;
    } catch {
      return fallback;
    }
  }

  return /^zone[-_\s]?\d+$/i.test(candidate) ? fallback : candidate;
}

function normalizeDeliveryZones(value: unknown): DeliveryZone[] {
  if (!Array.isArray(value) || value.length === 0) {
    return DEFAULT_DELIVERY_ZONES;
  }

  const result = value
    .map((zone, index) => {
      if (!zone) return null;

      // Gestion robuste si la zone est une simple chaîne de caractères (Ancien format Melahel)
      if (typeof zone === 'string') {
        return {
          id: `zone-${index + 1}`,
          name: getReadableCityName(zone, DEFAULT_DELIVERY_ZONES[index]?.name || `Ville ${index + 1}`),
          fee: index === 0 ? 1000 : index === 1 ? 1500 : 2000
        } satisfies DeliveryZone;
      }

      if (typeof zone === 'object') {
        const candidate = zone as Partial<DeliveryZone> & { city?: string; label?: string };
        const id = candidate.id || `zone-${index + 1}`;
        const rawName = candidate.name || candidate.city || candidate.label || '';
        const fallbackCity = DEFAULT_DELIVERY_ZONES.find((defaultZone) => defaultZone.id === id)?.name
          || DEFAULT_DELIVERY_ZONES[index]?.name
          || `Ville ${index + 1}`;
        return {
          id,
          name: getReadableCityName(rawName, fallbackCity),
          fee: Number(candidate.fee || 0)
        } satisfies DeliveryZone;
      }

      return null;
    })
    .filter((zone): zone is DeliveryZone => zone !== null);

  return result.length > 0 ? result : DEFAULT_DELIVERY_ZONES;
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

function normalizeTestimonials(value: unknown): TestimonialsData {
  if (!value || typeof value !== 'object') {
    return DEFAULT_TESTIMONIALS;
  }

  const cand = value as Partial<TestimonialsData>;
  return {
    screenshot_url: cand.screenshot_url || DEFAULT_TESTIMONIALS.screenshot_url,
    screenshot_quote: cand.screenshot_quote || DEFAULT_TESTIMONIALS.screenshot_quote,
    videos: Array.isArray(cand.videos) && cand.videos.length > 0 ? cand.videos : DEFAULT_TESTIMONIALS.videos
  };
}

function normalizeFAQ(value: unknown): FAQItem[] {
  if (Array.isArray(value) && value.length > 0) {
    return value as FAQItem[];
  }
  return DEFAULT_FAQ;
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
    delivery_time: rawSettings?.delivery_time || defaults.delivery_time,
    checkout_order_template: normalizeTemplate(rawSettings?.checkout_order_template, defaults.checkout_order_template),
    order_followup_template: normalizeTemplate(rawSettings?.order_followup_template, defaults.order_followup_template),
    order_confirmed_template: normalizeTemplate(rawSettings?.order_confirmed_template, defaults.order_confirmed_template),
    order_delivered_template: normalizeTemplate(rawSettings?.order_delivered_template, defaults.order_delivered_template),
    story_share_template: normalizeTemplate(rawSettings?.story_share_template, defaults.story_share_template),
    vip_magic_template: normalizeTemplate(rawSettings?.vip_magic_template, defaults.vip_magic_template),
    driver_dispatch_template: normalizeTemplate(rawSettings?.driver_dispatch_template, defaults.driver_dispatch_template),
    product_share_template: normalizeTemplate(rawSettings?.product_share_template, defaults.product_share_template),
    outfit_share_template: normalizeTemplate(rawSettings?.outfit_share_template, defaults.outfit_share_template),
    content_share_template: normalizeTemplate(rawSettings?.content_share_template, defaults.content_share_template),
    customer_relaunch_template: normalizeTemplate(rawSettings?.customer_relaunch_template, defaults.customer_relaunch_template),
    customer_segmentation: normalizeSegmentation(rawSettings?.customer_segmentation),
    logo_url: rawSettings?.logo_url || '',
    hero_title: rawSettings?.hero_title || defaults.hero_title,
    hero_subtitle: rawSettings?.hero_subtitle || defaults.hero_subtitle,
    hero_video_url: rawSettings?.hero_video_url || defaults.hero_video_url,
    footer_description: rawSettings?.footer_description || defaults.footer_description,
    floating_whatsapp_text: rawSettings?.floating_whatsapp_text || defaults.floating_whatsapp_text,
    social_title: rawSettings?.social_title || defaults.social_title,
    social_description: rawSettings?.social_description || defaults.social_description,
    social_image_url: rawSettings?.social_image_url || defaults.social_image_url,
    testimonials_json: normalizeTestimonials(rawSettings?.testimonials_json),
    faq_json: normalizeFAQ(rawSettings?.faq_json),
    updated_at: rawSettings?.updated_at || defaults.updated_at
  };
}

function getMemorySettings(): ShopSettings | null {
  const globalContext = globalThis as unknown as { __PERSCADORS_SETTINGS_CACHE__?: ShopSettings };
  return globalContext.__PERSCADORS_SETTINGS_CACHE__ || null;
}

function setSettingsFallback(settings: ShopSettings): void {
  const globalContext = globalThis as unknown as { __PERSCADORS_SETTINGS_CACHE__?: ShopSettings };
  globalContext.__PERSCADORS_SETTINGS_CACHE__ = settings;

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
    } catch {
      // Le cache est un fallback : une erreur de stockage ne bloque pas l'interface.
    }
  }
}

function getLocalSettingsFallback(): ShopSettings | null {
  if (typeof window === 'undefined') return null;

  try {
    const saved = window.localStorage.getItem(SETTINGS_CACHE_KEY);
    return saved ? normalizeShopSettings(JSON.parse(saved) as Partial<ShopSettings>) : null;
  } catch {
    return null;
  }
}

/**
 * Lecture destinée à la vitrine et au checkout anonymes.
 * Les modèles commerciaux, le numéro livreur et la segmentation ne sont jamais
 * lus depuis public.shop_settings par un navigateur non authentifié.
 *
 * Impl 6 — Déduplication : plusieurs composants publics (Navbar, Hero, Footer,
 * WhatsAppFloat, Testimonials, FAQ, ArticleRequestSection, checkout) appellent
 * cette fonction au montage. Sans garde-fou, cela génère 8+ requêtes Supabase
 * redondantes. On partage donc UNE promesse en vol et un cache mémoire à TTL
 * court, invalidé par le canal Realtime partagé (src/lib/publicRealtime.ts).
 */
const PUBLIC_SETTINGS_TTL_MS = 30_000;
let publicSettingsInFlight: Promise<ShopSettings> | null = null;
let publicSettingsCache: { value: ShopSettings; expiresAt: number } | null = null;

export function seedPublicShopSettingsCache(settings: ShopSettings): void {
  // PERF-02 — Le serveur possède déjà les réglages : on amorce le cache TTL
  // partagé, ainsi TOUS les consommateurs clients (provider, Hero, Navbar,
  // Footer, FAQ, checkout...) servent la valeur sans requête réseau.
  publicSettingsCache = { value: settings, expiresAt: Date.now() + PUBLIC_SETTINGS_TTL_MS };
}

export function invalidatePublicShopSettingsCache(): void {
  publicSettingsCache = null;
}

// Consolidation 09/2026 — lecture SYNCHRONE (aucune requête, aucun await) du
// cache amorcé par le DataHydrator : sert d'état initial au provider pour
// que l'hydratation React corresponde à l'HTML serveur.
export function readSeededPublicShopSettings(): ShopSettings | null {
  return publicSettingsCache && publicSettingsCache.expiresAt > Date.now()
    ? publicSettingsCache.value
    : null;
}

export async function fetchPublicShopSettings(): Promise<ShopSettings | null> {
  if (publicSettingsCache && publicSettingsCache.expiresAt > Date.now()) {
    return publicSettingsCache.value;
  }
  if (!publicSettingsInFlight) {
    publicSettingsInFlight = fetchPublicShopSettingsUncached()
      .then((settings) => {
        publicSettingsCache = { value: settings, expiresAt: Date.now() + PUBLIC_SETTINGS_TTL_MS };
        return settings;
      })
      .finally(() => {
        publicSettingsInFlight = null;
      });
  }
  return publicSettingsInFlight;
}

async function fetchPublicShopSettingsUncached(): Promise<ShopSettings> {
  if (!supabase) return getDefaultShopSettings();

  const { data, error } = await supabase
    .from('public_shop_settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    console.warn('Lecture publique des réglages indisponible:', error?.message || 'erreur inconnue');
    return getDefaultShopSettings();
  }

  return normalizeShopSettings(data as Partial<ShopSettings>);
}

/**
 * PERF-02 — Lecture serveur des réglages publics (client supabase-js direct,
 * sans cookies navigateur — même pattern que fetchServerCatalogSnapshot).
 * Retourne null en cas d'échec : la page n'hydrate alors rien et le client
 * retombe sur son comportement historique (fetch + cache TTL).
 */
export async function fetchServerPublicShopSettings(): Promise<ShopSettings | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;

  const client = createClient(url, anonKey, { auth: { persistSession: false } });
  const { data, error } = await client
    .from('public_shop_settings')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return normalizeShopSettings(data as Partial<ShopSettings>);
}

export async function fetchShopSettings(): Promise<ShopSettings | null> {
  // Lorsqu'il est disponible, Supabase est la référence partagée : aucun cache local
  // ne doit masquer une modification effectuée depuis un autre appareil.
  if (supabase) {
    const { data, error } = await supabase
      .from('shop_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const settings = normalizeShopSettings(data as Partial<ShopSettings>);
      setSettingsFallback(settings);
      return settings;
    }

    console.warn('Lecture réglages Supabase indisponible:', error?.message || 'erreur inconnue');
  }

  // Hors ligne ou en cas d'échec temporaire seulement : session, puis cache navigateur.
  return getMemorySettings() || getLocalSettingsFallback() || getDefaultShopSettings();
}

export async function upsertShopSettings(
  settings: Partial<ShopSettings>
): Promise<ApiResponse<ShopSettings>> {
  const existingSettings = await fetchShopSettings();
  const nextSettings = normalizeShopSettings({
    ...existingSettings,
    ...settings,
    updated_at: getCurrentIsoDate()
  });

  if (!supabase) {
    return {
      data: null,
      error: 'Impossible d’enregistrer les réglages sans connexion à la boutique.'
    };
  }

  const { data, error } = await requireSupabase()
    .from('shop_settings')
    .upsert({ id: SETTINGS_ROW_ID, ...nextSettings })
    .select()
    .single();

  if (error) {
    // Ne jamais présenter une modification locale comme une sauvegarde partagée.
    const normalized = logSupabaseWarning('shop_settings', error);
    return { data: null, error: normalized.userMessage };
  }

  const persistedSettings = normalizeShopSettings(data as Partial<ShopSettings>);
  setSettingsFallback(persistedSettings);
  return { data: persistedSettings, error: null };
}

export async function updateWhatsAppPhone(phone: string): Promise<ApiResponse<ShopSettings>> {
  return await upsertShopSettings({ whatsapp_phone: phone });
}

export async function updateDeliveryZones(
  zones: ShopSettings['delivery_zones']
): Promise<ApiResponse<ShopSettings>> {
  return await upsertShopSettings({ delivery_zones: zones });
}

export async function updateWhatsAppTemplates(templates: {
  checkout_order_template?: string;
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

export function formatWhatsAppMessage(
  template: string,
  variables: {
    shopName?: string;
    clientName?: string;
    orderId?: string;
    orderSubtotal?: string;
    productName?: string;
    productPrice?: string;
    lookName?: string;
    lookPrice?: string;
    contentTitle?: string;
    contentMessage?: string;
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
  if (variables.orderSubtotal) message = message.replace(/{orderSubtotal}/g, variables.orderSubtotal);
  if (variables.productName) message = message.replace(/{productName}/g, variables.productName);
  if (variables.productPrice) message = message.replace(/{productPrice}/g, variables.productPrice);
  if (variables.lookName) message = message.replace(/{lookName}/g, variables.lookName);
  if (variables.lookPrice) message = message.replace(/{lookPrice}/g, variables.lookPrice);
  if (variables.contentTitle) message = message.replace(/{contentTitle}/g, variables.contentTitle);
  if (variables.contentMessage) message = message.replace(/{contentMessage}/g, variables.contentMessage);
  if (variables.clientPhone) message = message.replace(/{clientPhone}/g, variables.clientPhone);
  if (variables.clientArea) message = message.replace(/{clientArea}/g, variables.clientArea);
  if (variables.itemsList) message = message.replace(/{itemsList}/g, variables.itemsList);
  if (variables.orderTotal) message = message.replace(/{orderTotal}/g, variables.orderTotal);
  if (variables.couponCode) message = message.replace(/{couponCode}/g, variables.couponCode);

  return message;
}
