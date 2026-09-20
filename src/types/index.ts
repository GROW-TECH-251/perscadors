export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL' | '39' | '40' | '41' | '42' | '43' | '44' | '45';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  image_url?: string;
  images: string[];
  sizes: Size[];
  outOfStockSizes?: Size[];
  colors: string[];
  outOfStockColors?: string[];
  inStock: boolean;
  description: string;
  isPopular?: boolean;
  video?: string;
  createdAt?: string;
  /** IMPL-2 (C2) — article masqué du catalogue : affiché uniquement dans la
   *  composition d'un look public (non cliquable, pas de fiche publique),
   *  jamais dans les listes, la recherche ni les catégories. */
  catalogHidden?: boolean;
}

export interface CatalogCategory {
  name: string;
  slug: string;
  image: string;
  count: number;
  countLabel: string;
  tagline: string;
  former_slugs?: string[];
}

export interface Outfit {
  id: string;
  name: string;
  image: string;
  price: number;
  products: Product[];
  /** IMPL-4 (C4) — décomposition du forfait affichée au public (uniquement
   *  si le look est en mode forfait ET configuré pour l'afficher). */
  priceBreakdown?: { label: string; amount: number }[];
}

export interface CartItem {
  product: Product;
  selectedSize: Size;
  selectedColor: string;
  quantity: number;
}

export interface CheckoutFormData {
  client_name: string;
  client_phone: string;
  client_area: string;
}

export type CheckoutStep = 1 | 2 | 3;