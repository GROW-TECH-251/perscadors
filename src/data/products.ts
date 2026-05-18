import { Product } from '@/types';

export const products: Product[] = [
  // === CATEGORY: BASKET POUR HOMME ===
  {
    id: 'basket-1',
    name: 'Basket Streetwear Classic Black & White',
    slug: 'basket-streetwear-classic-black-white',
    category: 'basket-pour-homme',
    price: 22000,
    images: [
      '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0012.jpg',
      '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0013.jpg',
      '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0014.jpg'
    ],
    sizes: ['40', '41', '42', '43', '44'],
    outOfStockSizes: ['40'],
    colors: ['Noir', 'Blanc'],
    outOfStockColors: [],
    inStock: true,
    description: 'Une basket premium pour un style streetwear élégant et intemporel. Semelle ultra-confortable et finitions haut de gamme signées HP Collection. Parfait pour vos sorties quotidiennes.',
    isPopular: true
  },
  {
    id: 'basket-2',
    name: 'Basket Urban Luxe Gold',
    slug: 'basket-urban-luxe-gold',
    category: 'basket-pour-homme',
    price: 24500,
    images: [
      '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0033.jpg',
      '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0034.jpg',
      '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0035.jpg'
    ],
    sizes: ['41', '42', '43', '44'],
    outOfStockSizes: ['44'],
    colors: ['Or', 'Blanc', 'Noir'],
    outOfStockColors: ['Or'],
    inStock: true,
    description: 'Affirmez votre statut avec cette basket unique dotée de détails or métallisés raffinés. Conçue pour ceux qui ne font aucun compromis sur le style.',
    isPopular: true
  },
  {
    id: 'basket-3',
    name: 'Runner Sport Premium White',
    slug: 'runner-sport-premium-white',
    category: 'basket-pour-homme',
    price: 19500,
    images: [
      '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0108.jpg',
      '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0109.jpg',
      '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0110.jpg'
    ],
    sizes: ['39', '40', '41', '42', '43'],
    outOfStockSizes: [],
    colors: ['Blanc', 'Gris'],
    outOfStockColors: [],
    inStock: true,
    description: 'Une légèreté inégalée alliée à un design futuriste et épuré. Idéale pour les looks urbains décontractés de Vioutou.'
  },
  {
    id: 'basket-4',
    name: 'Sneaker High Top Noir Intense',
    slug: 'sneaker-high-top-noir-intense',
    category: 'basket-pour-homme',
    price: 25000,
    images: [
      '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0111.jpg',
      '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0112.jpg',
      '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0113.jpg'
    ],
    sizes: ['40', '41', '42', '43', '44'],
    outOfStockSizes: ['41', '42'],
    colors: ['Noir', 'Rouge'],
    outOfStockColors: ['Rouge'],
    inStock: false, // Rupture de stock test
    description: 'Le modèle High Top emblématique. Confectionné dans un cuir premium ultra résistant pour braver la rue avec élégance. Épuisé pour le moment !'
  },
  {
    id: 'basket-5',
    name: 'Retro Trainer Multi-Color',
    slug: 'retro-trainer-multi-color',
    category: 'basket-pour-homme',
    price: 18000,
    images: [
      '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0114.jpg',
      '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0115.jpg',
      '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0116.jpg'
    ],
    sizes: ['39', '40', '41', '42', '43', '44'],
    outOfStockSizes: [],
    colors: ['Multi', 'Bleu', 'Blanc'],
    outOfStockColors: [],
    inStock: true,
    description: 'Inspirée des archives des années 90, cette sneaker rétro apporte une touche de couleur audacieuse à vos tenues les plus simples.'
  },

  // === CATEGORY: COMPLET POUR HOMME ===
  {
    id: 'complet-1',
    name: 'Ensemble Denim Louis Luxury Blue',
    slug: 'ensemble-denim-louis-luxury-blue',
    category: 'complet-pour-homme',
    price: 25000,
    images: [
      '/images/ARTICLES/COMPLET POUR HOMME/IMG-20251014-WA0006.jpg',
      '/images/ARTICLES/COMPLET POUR HOMME/IMG-20251014-WA0007.jpg'
    ],
    sizes: ['M', 'L', 'XL', 'XXL'],
    outOfStockSizes: ['XXL'],
    colors: ['Bleu Denim', 'Noir'],
    outOfStockColors: [],
    inStock: true,
    description: 'Un ensemble veste et pantalon en denim premium imprimé monogramme d\'inspiration haute couture. Style ultime garanti.',
    isPopular: true
  },
  {
    id: 'complet-2',
    name: 'Complet Street Over-Size Black & White',
    slug: 'complet-street-over-size-black-white',
    category: 'complet-pour-homme',
    price: 23500,
    images: [
      '/images/ARTICLES/COMPLET POUR HOMME/IMG-20251014-WA0008.jpg',
      '/images/ARTICLES/COMPLET POUR HOMME/IMG-20251014-WA0009.jpg'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    outOfStockSizes: ['S'],
    colors: ['Noir/Blanc', 'Blanc/Noir'],
    outOfStockColors: [],
    inStock: true,
    description: 'Le confort absolu d\'une coupe oversize alliée au prestige streetwear de HP Collection. Tissu lourd et ultra-doux.'
  },
  {
    id: 'complet-3',
    name: 'Complet Casual Summer Creme',
    slug: 'complet-casual-summer-creme',
    category: 'complet-pour-homme',
    price: 21000,
    images: [
      '/images/ARTICLES/COMPLET POUR HOMME/IMG-20251014-WA0010.jpg',
      '/images/ARTICLES/COMPLET POUR HOMME/IMG-20251014-WA0011.jpg'
    ],
    sizes: ['M', 'L', 'XL'],
    outOfStockSizes: [],
    colors: ['Crème', 'Beige'],
    outOfStockColors: [],
    inStock: true,
    description: 'Restez frais et élégant même pendant les journées les plus chaudes avec cet ensemble en lin respirant haut de gamme.'
  },

  // === CATEGORY: JEAN OVERSIDE POUR HOMME ===
  {
    id: 'jean-1',
    name: 'Jean Oversize Margiela Blue & Black Combo',
    slug: 'jean-oversize-margiela-blue-black-combo',
    category: 'jean-overside-pour-homme',
    price: 18500,
    images: [
      '/images/ARTICLES/JEAN OVERSIDE POUR HOMME/IMG-20251014-WA0037.jpg',
      '/images/ARTICLES/JEAN OVERSIDE POUR HOMME/IMG-20251014-WA0038.jpg',
      '/images/ARTICLES/JEAN OVERSIDE POUR HOMME/IMG-20251014-WA0039.jpg'
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    outOfStockSizes: ['S', 'XXL'],
    colors: ['Bleu Délavé', 'Noir'],
    outOfStockColors: [],
    inStock: true,
    description: 'Un jean large et structuré avec un patch brodé iconique sur la poche arrière. Le favori de Vioutou pour un look streetwear inimitable.',
    isPopular: true
  },
  {
    id: 'jean-2',
    name: 'Cargo Denim Oversize Heavy Grey',
    slug: 'cargo-denim-oversize-heavy-grey',
    category: 'jean-overside-pour-homme',
    price: 17000,
    images: [
      '/images/ARTICLES/JEAN OVERSIDE POUR HOMME/IMG-20251014-WA0040.jpg',
      '/images/ARTICLES/JEAN OVERSIDE POUR HOMME/IMG-20251014-WA0041.jpg',
      '/images/ARTICLES/JEAN OVERSIDE POUR HOMME/IMG-20251014-WA0042.jpg'
    ],
    sizes: ['M', 'L', 'XL'],
    outOfStockSizes: [],
    colors: ['Gris Anthracite', 'Bleu Brut'],
    outOfStockColors: [],
    inStock: true,
    description: 'Coupe cargo moderne avec poches latérales volumineuses. Denim lourd 14oz résistant et ultra-stylé.'
  },
  {
    id: 'jean-3',
    name: 'Jean Baggy Destroyed Vintage',
    slug: 'jean-baggy-destroyed-vintage',
    category: 'jean-overside-pour-homme',
    price: 19000,
    images: [
      '/images/ARTICLES/JEAN OVERSIDE POUR HOMME/IMG-20251014-WA0043.jpg',
      '/images/ARTICLES/JEAN OVERSIDE POUR HOMME/IMG-20251014-WA0044.jpg',
      '/images/ARTICLES/JEAN OVERSIDE POUR HOMME/IMG-20251014-WA0045.jpg'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    outOfStockSizes: ['XL'],
    colors: ['Bleu Clair', 'Noir Délavé'],
    outOfStockColors: [],
    inStock: true,
    description: 'Déchirures et délavage rétro travaillés à la main. Une pièce maîtresse pour un style grunge haut de gamme.'
  },
  {
    id: 'jean-4',
    name: 'Jean Wide-Leg Classic Raw',
    slug: 'jean-wide-leg-classic-raw',
    category: 'jean-overside-pour-homme',
    price: 16500,
    images: [
      '/images/ARTICLES/JEAN OVERSIDE POUR HOMME/IMG-20251014-WA0046.jpg',
      '/images/ARTICLES/JEAN OVERSIDE POUR HOMME/IMG-20251014-WA0047.jpg',
      '/images/ARTICLES/JEAN OVERSIDE POUR HOMME/IMG-20251014-WA0048.jpg'
    ],
    sizes: ['M', 'L', 'XL', 'XXL'],
    outOfStockSizes: [],
    colors: ['Bleu Brut'],
    outOfStockColors: [],
    inStock: true,
    description: 'La simplicité et le raffinement d\'une coupe droite extra-large. Une polyvalence totale pour tous vos outfits.'
  },

  // === CATEGORY: TAPETTES POUR HOMME ===
  {
    id: 'tapette-1',
    name: 'Sandale Suede Cozy UGG Style',
    slug: 'sandale-suede-cozy-ugg-style',
    category: 'tapettes-pour-homme',
    price: 14500,
    images: [
      '/images/ARTICLES/TAPETTES POUR HOMME/IMG-20251014-WA0026.jpg',
      '/images/ARTICLES/TAPETTES POUR HOMME/IMG-20251014-WA0027.jpg',
      '/images/ARTICLES/TAPETTES POUR HOMME/IMG-20251014-WA0028.jpg'
    ],
    sizes: ['39', '40', '41', '42', '43', '44'],
    outOfStockSizes: ['39', '44'],
    colors: ['Camel', 'Gris', 'Noir', 'Khaki'],
    outOfStockColors: [],
    inStock: true,
    description: 'Le confort d\'un chausson allié au prestige d\'une sandale extérieure en daim premium. Double bride ajustable pour un maintien parfait.',
    isPopular: true
  },
  {
    id: 'tapette-2',
    name: 'Slide Premium Logo Black',
    slug: 'slide-premium-logo-black',
    category: 'tapettes-pour-homme',
    price: 11000,
    images: [
      '/images/ARTICLES/TAPETTES POUR HOMME/IMG-20251014-WA0029.jpg',
      '/images/ARTICLES/TAPETTES POUR HOMME/IMG-20251014-WA0030.jpg'
    ],
    sizes: ['40', '41', '42', '43'],
    outOfStockSizes: [],
    colors: ['Noir', 'Blanc'],
    outOfStockColors: [],
    inStock: true,
    description: 'Une claquette haut de gamme légère, avec semelle anatomique moulée et bride embossée du logo HP Collection. L\'indispensable détente.'
  },
  {
    id: 'tapette-3',
    name: 'Mule Urban Outdoor Leather',
    slug: 'mule-urban-outdoor-leather',
    category: 'tapettes-pour-homme',
    price: 15000,
    images: [
      '/images/ARTICLES/TAPETTES POUR HOMME/IMG-20251014-WA0031.jpg',
      '/images/ARTICLES/TAPETTES POUR HOMME/IMG-20251014-WA0032.jpg'
    ],
    sizes: ['41', '42', '43', '44'],
    outOfStockSizes: ['41'],
    colors: ['Marron', 'Noir'],
    outOfStockColors: [],
    inStock: true,
    description: 'Un design audacieux fermé sur le devant. Fabriquée dans un cuir épais patiné pour un look urbain ultra-tendance.'
  }
];

export const getProductById = (id: string) => products.find(p => p.id === id);
export const getProductsByCategory = (category: string) => products.filter(p => p.category === category);
export const getPopularProducts = () => products.filter(p => p.isPopular);
