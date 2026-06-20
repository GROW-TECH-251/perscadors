export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL' | '39' | '40' | '41' | '42' | '43' | '44';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number; // en FCFA
  image_url: string ; // URL de l'image principale
  images: string[]; // images angles
  sizes: Size[];
  outOfStockSizes?: Size[]; // tailles épuisées (grisées)
  colors: string[]; // couleurs
  outOfStockColors?: string[]; // couleurs épuisées (grisées)
  inStock: boolean;
  description: string;
  isPopular?: boolean;
}

export interface Outfit {
  id: string;
  name: string;
  image: string;
  price: number;
  products: Product[];
}

export interface CartItem {
  product: Product;
  selectedSize: Size;
  selectedColor: string;
  quantity: number;
}

export interface Customer {
  name: string;
  email?: string;
  phone: string;
  address: string;
  city: string;
}

export interface Order {
  id: string;
  token: string;
  items: CartItem[];
  customer: Customer;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}
// ============================================
// CHECKOUT & COMMANDES
// ============================================

export type OrderStatus =
  | 'EN ATTENTE'
  | 'CONFIRMÉE'
  | 'EN LIVRAISON'
  | 'LIVRÉE'
  | 'ANNULÉE';

export type PaymentStatus =
  | 'NON PAYÉ'
  | 'PAIEMENT À LA LIVRAISON'
  | 'PAYÉ'
  | 'REMBOURSÉ';

export interface CheckoutFormData {
  client_name: string;
  client_phone: string;
  client_area: string;
}

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image?: string;
}

export interface CreatedOrder {
  id: number;
  order_number: string;
  public_token: string;
  status: OrderStatus;
  client_name: string;
  client_phone: string;
  client_area: string;
  items: OrderItem[];
  total: number;
  delivery_fee: number;
  grand_total: number;
  created_at: string;
}

export type CheckoutStep = 1 | 2 | 3;