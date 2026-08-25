import { Outfit } from '@/types';
import { products } from './products';

// Liste statique des images présentes dans `public/assets/collections/outfits`
// Générée depuis l'état actuel du dossier pour éviter l'utilisation de `fs` côté client.
const outfitIndices: number[] = [2,3,4,5,6,7,8,9,10,11,12,14,16,17,18,19,20,21,22,23,24,25,26,27,28,29,31];

// Auto-seeding des Looks en fonction des images présentes
export const outfits: Outfit[] = outfitIndices.map((fileIndex, idx) => {
  const seq = idx + 1; // sequence for distribution logic

  // Distribution logique des pièces parmi le catalogue
  let associatedProducts = [products[0], products[6]];
  if (seq % 4 === 0) {
    associatedProducts = [products[1], products[9], products[15]];
  } else if (seq % 4 === 1) {
    associatedProducts = [products[5], products[13], products[18]];
  } else if (seq % 4 === 2) {
    associatedProducts = [products[2], products[7], products[14]];
  } else {
    associatedProducts = [products[3], products[10], products[16]];
  }

  const totalPrice = associatedProducts.reduce((sum, p) => sum + (p?.price || 0), 0);

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

  const name = stylingNames[idx % stylingNames.length] + ` (Look #${fileIndex})`;

  return {
    id: `outfit-${fileIndex}`,
    name,
    image: `/assets/collections/outfits/outfit${fileIndex}.jpeg`,
    price: totalPrice,
    products: associatedProducts.filter(Boolean)
  };
});

export const getOutfitById = (id: string) => outfits.find((o) => o.id === id);
