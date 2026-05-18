import type { Metadata } from 'next';
import { Barlow, Bebas_Neue } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat';
import { CartDrawer } from '@/components/cart/CartDrawer';

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
  title: 'HP Collection | Boutique E-commerce Streetwear Premium',
  description: 'Boutique premium de mode streetwear par l\'influenceur Vioutou. Commandes instantanées via WhatsApp avec livraison express dans tout le Bénin.',
  keywords: ['streetwear', 'mode', 'bénin', 'vioutou', 'baskets', 'complets', 'jean oversize', 'cotonou', 'vêtements premium'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${barlow.variable} ${bebasNeue.variable} h-full antialiased scroll-smooth`}>
      <body className="min-h-full flex flex-col bg-brand-bg text-brand-text font-barlow selection:bg-brand-gold/30 selection:text-brand-text">
        <CartProvider>
          <Navbar />
          <main className="flex-grow pt-20">
            {children}
          </main>
          <CartDrawer />
          <WhatsAppFloat />
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
