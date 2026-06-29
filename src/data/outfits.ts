import { Outfit } from '@/types';
import { products } from './products';

// Auto-seeding des 32 HP Looks du Repo avec assignation variée sur l'intégralité du catalogue
export const outfits: Outfit[] = Array.from({ length: 32 }, (_, i) => {
  const index = i + 1;
  
  // Distribution logique des pièces parmi les 19 articles du catalogue
  let associatedProducts = [products[0], products[6]]; // defaults: Basket 1 + Complet 1
  if (index % 4 === 0) {
    associatedProducts = [products[1], products[9], products[15]]; // Basket 2 + Jean 1 + Tapette 1
  } else if (index % 4 === 1) {
    associatedProducts = [products[5], products[13], products[18]]; // Sneaker Vioutou + Jean Carpenter + Claquette VIP
  } else if (index % 4 === 2) {
    associatedProducts = [products[2], products[7], products[14]]; // Runner Sport + Complet Street + Jean Cargo
  } else {
    associatedProducts = [products[3], products[10], products[16]]; // High Top + Cargo Heavy + Slide Premium
  }

  const totalPrice = associatedProducts.reduce((sum, p) => sum + (p?.price || 0), 0);

  // Styling names premium
  const stylingNames = [
    'Urban Royalty', 'Denim Deluxe', 'Luxe Streetwear', 'Minimalist Vibe',
    'Margiela Flow', 'Cozy Street Wear', 'Sport Runner Elite', 'Benin Trendsetter',
    'Gold Accented King', 'Classic HP Drip', 'Casual Linen Breeze', 'Oversized Monogram',
    'Shadow Black Street', 'Retro Hype Style', 'Modern Safari', 'Dapper Street Boy',
    'Golden Hour Glow', 'VIP Influencer Look', 'Clean Slate White', 'Heavy Cotton Comfort',
    'Dripping In Gold', 'Sunset Vibe Outfit', 'Summer Suede Vibe', 'Street Silhouette',
    'High Top Classic', 'Cargo Explorer', 'Monochrome Hype', 'Luxe Cozy Day',
    'Signature HP Drip', 'Elegance & Flow', 'Streetwear Heritage', 'Urban Legend'
  ];

  const name = stylingNames[i % stylingNames.length] + ` (Look #${index})`;

  return {
    id: `outfit-${index}`,
    name,
    image: `/images/OUTFITCOLLECTION/outfit${index}.jpeg`,
    price: totalPrice,
    products: associatedProducts.filter(Boolean)
  };
});

export const getOutfitById = (id: string) => outfits.find(o => o.id === id);
