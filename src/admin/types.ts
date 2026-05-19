// src/admin/types.ts
// ============================================
// Types TypeScript pour l'administration
// ============================================
// Ces types sont utilisés dans tous les écrans admin

// ============================================
// NAVIGATION & UI
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

// ============================================
// PRODUITS
// ============================================

export interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  categoryLabel?: string;
  price: number;
  stock?: number;
  sizes: string[];
  colors: string[];
  outOfStockSizes?: string[];
  outOfStockColors?: string[];
  images: string[];
  description: string;
  visible: boolean;
  badge?: string;
  isPopular?: boolean;
  inStock: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFormData {
  name: string;
  slug: string;
  category: string;
  price: number;
  stock?: number;
  sizes: string[];
  colors: string[];
  outOfStockSizes: string[];
  outOfStockColors: string[];
  images: string[];
  description: string;
  visible: boolean;
  badge?: string;
  isPopular: boolean;
}

// ============================================
// COMMANDES
// ============================================

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
  id: string;
  order_number: string;
  status: OrderStatus;
  client_name: string;
  client_phone: string;
  client_area: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  history: OrderHistoryEntry[];
  created_at: string;
  updated_at: string;
}

export interface OrderFormData {
  client_name: string;
  client_phone: string;
  client_area: string;
  items: OrderItem[];
  status: OrderStatus;
  delivery_fee: number;
}

// ============================================
// CLIENTS
// ============================================

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

// ============================================
// CATÉGORIES
// ============================================

export interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  visible: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
}

// ============================================
// CONTENU / ACTUALITÉS
// ============================================

export type ContentPostType = 'news' | 'blog' | 'announcement';

export interface ContentPost {
  id: string;
  title: string;
  slug: string;
  type: ContentPostType;
  content: string;
  excerpt?: string;
  image?: string;
  author: string;
  published: boolean;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// PARAMÈTRES BOUTIQUE
// ============================================

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  freeThreshold: number;
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
  customer_segmentation: {
    vip_threshold: number;
    loyal_threshold: number;
    big_cart_threshold: number;
  };
  logo_url?: string;
  updated_at?: string;
}

// ============================================
// ANALYTICS
// ============================================

export interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  averageOrderValue: number;
  ordersByStatus: Record<OrderStatus, number>;
  revenueByCategory: Record<string, number>;
  topProducts: Array<{
    name: string;
    sales: number;
    revenue: number;
  }>;
  recentOrders: AdminOrder[];
  lowStockProducts: AdminProduct[];
}

// ============================================
// AUTHENTIFICATION
// ============================================

export interface AuthResult {
  ok: boolean;
  message: string;
}

// ============================================
// UTILITAIRES
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}