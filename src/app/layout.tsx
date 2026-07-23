// src/app/layout.tsx
// ============================================
// Layout Racine Next.js (Forcé Dynamique & Optimisation SEO / Open Graph Universelle)
// ============================================

export const dynamic = 'force-dynamic';
export const revalidate = 0;

import type { Metadata } from 'next';
import { Barlow, Bebas_Neue } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { CatalogProvider } from '@/context/CatalogContext';

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-barlow',
  display: 'swap',
});

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bebas',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://perscadors.vercel.app'),
  title: {
    default: 'HP Collection | Boutique E-commerce Streetwear Premium',
    template: '%s | HP Collection Cotonou'
  },
  description: 'Boutique premium de mode streetwear par l\'influenceur Vioutou à Cotonou, Bénin. Baskets, complets, jeans oversize et claquettes VIP. Commandes instantanées via WhatsApp avec livraison express.',
  keywords: ['streetwear', 'mode', 'bénin', 'vioutou', 'baskets', 'complets', 'jean oversize', 'cotonou', 'vêtements premium', 'hp collection', 'prêt-à-porter'],
  authors: [{ name: 'Vioutou (HP Collection)', url: 'https://perscadors.vercel.app' }],
  creator: 'HP Collection / Perscadors Digital Agency',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'HP Collection | Boutique E-commerce Streetwear Premium',
    description: 'Boutique premium de mode streetwear par l\'influenceur Vioutou à Cotonou, Bénin. Baskets, complets, jeans oversize et claquettes VIP. Commandes instantanées via WhatsApp avec livraison express.',
    url: 'https://perscadors.vercel.app',
    siteName: 'HP Collection Bénin',
    images: [
      {
        url: '/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0036.jpg?v=20260630',
        width: 1200,
        height: 630,
        alt: 'HP Collection — Boutique Streetwear Premium à Cotonou',
      },
    ],
    locale: 'fr_BJ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HP Collection | Boutique E-commerce Streetwear Premium',
    description: 'Boutique premium de mode streetwear par l\'influenceur Vioutou à Cotonou, Bénin. Commandes instantanées via WhatsApp avec livraison express.',
    images: ['/images/ARTICLES/BASKET POUR HOMME/IMG-20251014-WA0036.jpg?v=20260630'],
  },
  icons: {
    icon: '/images/LOGOSITE/logo.png?v=20260630',
    shortcut: '/images/LOGOSITE/logo.png?v=20260630',
    apple: '/images/LOGOSITE/logo.png?v=20260630',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" data-scroll-behavior="smooth" suppressHydrationWarning className={`${barlow.variable} ${bebasNeue.variable} h-full antialiased scroll-smooth`}>
      <head>
        <link rel="canonical" href="https://perscadors.vercel.app" />
      </head>
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text font-barlow selection:bg-brand-gold/30 selection:text-brand-text">
        <CatalogProvider>
          <CartProvider>
            <main className="flex-grow">
              {children}
            </main>
          </CartProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
