// src/admin/types.ts
// ============================================
// Types TypeScript pour l'administration et le Checkout
// ============================================

export type AdminScreen = 
  | 'home'
  | 'products'
  | 'editProduct'
  | 'categories'
  | 'orders'
  | 'orderDetail'
  | 'customers'
  | 'customerDetail'
  | 'analytics'
  | 'content'
  | 'newPost'
  | 'editPost'
  | 'stockAlerts'
  | 'settings'
  | 'qa'
  | 'hpb';

export interface NavItem {
  id: AdminScreen;
  label: string;
  icon: string;
  badge?: number;
}

export interface AdminProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  image_url: string | null;
  images: string[];
  sizes: string[];
  colors: string[];
  outOfStockSizes: string[];
  outOfStockColors: string[];
  demand: number;
  stock: number;
  badge: string | null;
  description: string | null;
  visible: boolean;
  slug: string;
  isPopular: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  category: string;
  price: number;
  image_url: string;
  images?: string[];
  sizes: string[];
  colors: string[];
  outOfStockSizes?: string[];
  outOfStockColors?: string[];
  stock: number;
  demand: number;
  badge: string;
  description: string;
  visible: boolean;
  slug?: string;
  isPopular?: boolean;
}

export type OrderStatus = 
  | 'EN ATTENTE'
  | 'CONFIRMÉE'
  | 'EN LIVRAISON'
  | 'LIVRÉE'
  | 'ANNULÉE';

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image?: string;
}

export interface OrderHistoryEntry {
  status: OrderStatus;
  date: string;
  note?: string;
}

export interface AdminOrder {
  id: number;
  order_number: string;
  public_token?: string;
  status: OrderStatus;
  payment_status?: string;
  payment_method?: string;
  client_name: string;
  client_phone: string;
  client_area: string;
  items: OrderItem[];
  history: OrderHistoryEntry[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  grand_total: number;
  created_at: string;
  updated_at: string;
}

export type CustomerSegment = 
  | 'VIP'
  | 'Fidèle'
  | 'Nouveau'
  | 'Gros panier'
  | 'À relancer'
  | 'Standard';

export interface CustomerSummary {
  phone: string;
  name: string;
  area: string;
  orderCount: number;
  totalSpent: number;
  lastOrderDate: string;
  lastOrderStatus: OrderStatus;
  preferredSizes: string[];
  preferredColors: string[];
  segments: CustomerSegment[];
  notes?: string;
  tags?: string[];
}

export interface CustomerMeta {
  phone: string;
  notes: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface AdminCategory {
  id: number;
  name: string;
  category: string;
  slug?: string;
  description?: string | null;
  image_url?: string | null;
  visible: boolean;
  position: number;
  order?: number;
  created_at: string;
  updated_at: string;
}

export type ContentPostType = 'Arrivage' | 'Promotion' | 'Nouveauté' | 'Annonce' | 'news' | string;

export interface ContentPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image_url: string | null;
  image: string;
  category: ContentPostType;
  type: string;
  status: 'draft' | 'published' | 'scheduled' | string;
  published: boolean;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  freeThreshold: number;
}

export interface CustomerSegmentationSettings {
  vip_threshold: number;
  loyal_threshold: number;
  big_cart_threshold: number;
}

export interface ShopSettings {
  shop_name: string;
  whatsapp_phone: string;
  driver_phone?: string;
  currency: string;
  country: string;
  delivery_zones: DeliveryZone[];
  delivery_free_threshold: number;
  delivery_time: string;
  order_followup_template: string;
  order_confirmed_template: string;
  order_delivered_template: string;
  story_share_template: string;
  vip_magic_template: string;
  driver_dispatch_template: string;
  customer_segmentation: CustomerSegmentationSettings;
  logo_url: string | null;
  updated_at: string;
}

export interface AuthResult {
  ok: boolean;
  message: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// ============================================
// CHECKOUT (pôle commandes & WhatsApp)
// ============================================

export interface CheckoutFormData {
  client_name: string;
  client_phone: string;
  client_area: string;
}

export type CheckoutStep = 1 | 2 | 3;

export type CreatedOrder = AdminOrder;

// ============================================
// OUTFITS & HP LOOKS (Pôle 5 & Module HPB)
// ============================================

export interface AdminOutfit {
  id: number;
  name: string;
  image_url: string;
  custom_price: number | null;
  product_ids: number[];
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface OutfitFormData {
  name: string;
  image_url: string;
  custom_price?: number | null;
  product_ids: number[];
  visible: boolean;
}
