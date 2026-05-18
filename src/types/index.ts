export type Size = 'S' | 'M' | 'L' | 'XL' | 'XXL' | '39' | '40' | '41' | '42' | '43' | '44';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number; // en FCFA
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
