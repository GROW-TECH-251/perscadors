import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import {
  productMetadata,
  looksMetadata,
  categoryMetadata,
  notFoundMetadata
} from '@/lib/seoMetadata';
import type { CatalogCategory, Outfit, Product } from '@/types';

const product: Product = {
  id: '1',
  name: 'Basket Streetwear Classic',
  slug: 'basket-streetwear-classic',
  category: 'basket-pour-homme',
  price: 22000,
  images: ['/assets/collections/articles/BASKET POUR HOMME/IMG-1.jpg'],
  sizes: ['40', '41'],
  colors: ['Noir'],
  inStock: true,
  description: 'Une basket premium pour un style streetwear élégant.'
};

const outfit: Outfit = {
  id: '1',
  name: 'Urban Royalty',
  image: '/assets/collections/outfits/outfit1.jpeg',
  price: 66000,
  products: [product]
};

const category: CatalogCategory = {
  name: 'Baskets Homme',
  slug: 'basket-pour-homme',
  image: '/assets/collections/articles/BASKET POUR HOMME/IMG-1.jpg',
  count: 10,
  countLabel: '10 produits',
  tagline: 'Des kicks premium pour imposer ton style.'
};

describe('Impl 9 — SEO : generateMetadata serveur', () => {
  it('productMetadata expose titre, description et OG dans le HTML initial', () => {
    const metadata = productMetadata(product);
    expect(metadata.title).toContain('Basket Streetwear Classic');
    expect(metadata.description).toBe(product.description);
    expect(metadata.openGraph?.title).toContain('Basket Streetwear Classic');
    expect(JSON.stringify(metadata.openGraph)).toContain('perscadors.vercel.app');
    expect(metadata.alternates?.canonical).toContain('/produit/1');
  });

  it('looksMetadata utilise l image du premier outfit', () => {
    const metadata = looksMetadata([outfit]);
    expect(metadata.title).toContain('HP Looks');
    expect(metadata.description).toContain('1 tenues');
    expect(JSON.stringify(metadata.openGraph)).toContain('outfit1.jpeg');
  });

  it('categoryMetadata retombe sur un slug humanisé si la catégorie est absente', () => {
    const metadata = categoryMetadata(category, 'basket-pour-homme');
    expect(metadata.title).toBe('Baskets Homme | HP Collection');

    const fallback = categoryMetadata(undefined, 'complet-pour-homme');
    expect(fallback.title).toBe('Complet Pour Homme | HP Collection');
  });

  it('notFoundMetadata bloque l indexation', () => {
    const metadata = notFoundMetadata();
    expect(metadata.title).toContain('Article introuvable');
    expect(metadata.robots).toEqual({ index: false });
  });

  it('les composants clients ne rendent plus title/meta dans le JSX', async () => {
    const produit = await readFile('src/app/produit/[id]/product-detail-client.tsx', 'utf-8');
    const looks = await readFile('src/app/looks/hp-looks-client.tsx', 'utf-8');
    expect(produit).not.toContain('<title>');
    expect(produit).not.toContain('<meta');
    expect(looks).not.toContain('<title>');
    expect(looks).not.toContain('<meta');
  });

  it('les pages exportent generateMetadata côté serveur', async () => {
    const produit = await readFile('src/app/produit/[id]/page.tsx', 'utf-8');
    const looks = await readFile('src/app/looks/page.tsx', 'utf-8');
    const categorie = await readFile('src/app/categorie/[slug]/page.tsx', 'utf-8');

    expect(produit).toContain('export async function generateMetadata');
    expect(looks).toContain('export async function generateMetadata');
    expect(categorie).toContain('export async function generateMetadata');
  });
});
