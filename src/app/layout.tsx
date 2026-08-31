// src/app/layout.tsx
// ============================================
// Layout Racine Next.js (Forcé Dynamique & Optimisation SEO / Open Graph Universelle)
// ============================================

import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Barlow, Bebas_Neue } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { CatalogProvider } from '@/context/CatalogContext';
import { PublicSettingsProvider } from '@/context/PublicSettingsContext';

// Performance : On retire force-dynamic pour permettre ISR et cache
// La génération de metadata utilise Promise.all déjà parallèle
// On garde un revalidate de 60s pour les métadonnées sociales
export const revalidate = 60;

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

const FALLBACK_TITLE = 'HP Collection | Boutique E-commerce Streetwear Premium';
const FALLBACK_DESCRIPTION = 'Boutique premium de mode streetwear par l\'influenceur Vioutou à Cotonou, Bénin. Commandes instantanées via WhatsApp.';
const FALLBACK_IMAGE = '/assets/collections/articles/BASKET POUR HOMME/IMG-20251014-WA0036.jpg';

export async function generateMetadata(): Promise<Metadata> {
  let title = FALLBACK_TITLE;
  let description = FALLBACK_DESCRIPTION;
  let image = FALLBACK_IMAGE;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  // FIX PUB-DATA-01 : permission denied shop_settings 401
  // Avant : client.from('shop_settings').select(...) avec anon key → 401 car RLS revoke select anon (migration limit_public_shop_settings.sql)
  // Après : utilise la vue publique public_shop_settings qui est autorisée anon/authenticated et contient seulement social_title, social_description, social_image_url
  // Cette vue est créée dans limit_public_shop_settings.sql avec security_invoker=false et grant select anon,authenticated
  if (url && key) {
    const client = createClient(url, key, { auth: { persistSession: false } });
    const [settingsResponse, bannerResponse] = await Promise.all([
      client.from('public_shop_settings').select('social_title,social_description,social_image_url').order('updated_at', { ascending: false }).limit(1).maybeSingle(),
      client.from('site_assets').select('url').eq('section', 'ambience').eq('active', true).order('updated_at', { ascending: false }).limit(1).maybeSingle()
    ]);
    const data = settingsResponse.data;
    if (data) { title = data.social_title || title; description = data.social_description || description; image = data.social_image_url || bannerResponse.data?.url || image; }
    else if (bannerResponse.data?.url) image = bannerResponse.data.url;
  }
  return { metadataBase: new URL('https://perscadors.vercel.app'), title, description, robots: { index: true, follow: true }, openGraph: { title, description, url: 'https://perscadors.vercel.app', siteName: 'HP Collection Bénin', images: [{ url: image, width: 1200, height: 630, alt: title }], locale: 'fr_BJ', type: 'website' }, twitter: { card: 'summary_large_image', title, description, images: [image] }, icons: { icon: '/assets/brand/logo.png', shortcut: '/assets/brand/logo.png', apple: '/assets/brand/logo.png' } };
}


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
        {/* OV-1 — Gates pré-paint de l'intro HP Collection : évaluées AVANT le
            premier rendu pour poser data-pescador-intro (CSS globals masque la
            section -> 0 flash, 0 CLS). Session vue / reduced-motion / Save-Data
            / ?intro=0 -> off ; ?intro=1 -> force la séquence. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement,q=new URLSearchParams(location.search).get('intro'),c=navigator.connection&&navigator.connection.saveData;d.setAttribute('data-pescador-intro',q==='0'||c?'off':'on');}catch(t){}})();`,
          }}
        />
        <CatalogProvider>
          <CartProvider>
            <PublicSettingsProvider>
              <main className="flex-grow">
                {children}
              </main>
            </PublicSettingsProvider>
          </CartProvider>
        </CatalogProvider>
      </body>
    </html>
  );
}
