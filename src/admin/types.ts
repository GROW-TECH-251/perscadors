// src/admin/types.ts
// ============================================
// Types TypeScript pour l'administration
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
  | 'qa';

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
  sizes: string[];
  colors: string[];
  demand: number;
  stock: number;
  badge: string | null;
  description: string | null;
  visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFormData {
  name: string;
  category: string;
  price: number;
  image_url: string;
  sizes: string[];
  colors: string[];
  stock: number;
  demand: number;
  badge: string;
  description: string;
  visible: boolean;
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
  status: OrderStatus;
  client_name: string;
  client_phone: string;
  client_area: string;
  items: OrderItem[];
  history: OrderHistoryEntry[];
  subtotal?: number;
  delivery_fee?: number;
  total: number;
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
  description: string | null;
  image_url: string | null;
  visible: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

export type ContentPostType = 'Arrivage' | 'Promotion' | 'Nouveauté' | 'Annonce';

export interface ContentPost {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  category: ContentPostType;
  status: 'draft' | 'published' | 'scheduled';
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
  currency: string;
  country: string;
  delivery_zones: DeliveryZone[];
  delivery_free_threshold: number;
  delivery_time: string;
  order_followup_template: string;
  order_confirmed_template: string;
  order_delivered_template: string;
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