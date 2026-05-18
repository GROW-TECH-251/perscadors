import { Outfit } from '@/types';
import { products } from './products';

// Let's create a list of outfits mapping all 32 images in OUTFITCOLLECTION.
// Each outfit has a curated list of associated products to "recreate the look".
export const outfits: Outfit[] = Array.from({ length: 32 }, (_, i) => {
  const index = i + 1;
  
  // Distribute items logically to outfits for the "Recreate this look" feature
  let associatedProducts = [products[0], products[5]]; // defaults
  if (index % 4 === 0) {
    associatedProducts = [products[1], products[8], products[11]];
  } else if (index % 4 === 1) {
    associatedProducts = [products[0], products[9]];
  } else if (index % 4 === 2) {
    associatedProducts = [products[2], products[6], products[11]];
  } else {
    associatedProducts = [products[4], products[7], products[12]];
  }

  const totalPrice = associatedProducts.reduce((sum, p) => sum + p.price, 0);

  // Generate fancy urban styling names
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
    products: associatedProducts
  };
});

export const getOutfitById = (id: string) => outfits.find(o => o.id === id);
