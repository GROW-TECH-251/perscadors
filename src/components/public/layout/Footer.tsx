 'use client';

import { useSiteAssetsRealtime } from '@/hooks/useSiteAssetsRealtime';
import { useShopSettingsRealtime } from '@/hooks/useShopSettingsRealtime';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchPublicShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import { fetchActiveAssetBySection } from '@/services/mediaService';
import type { ShopSettings } from '@/admin/types';
import { MapPin } from 'lucide-react';
// MISSION SEO (07/11) — présence officielle vérifiée (TikTok, Google Maps).
// Facebook s'affichera automatiquement dès confirmation de son URL permanente.
import { TIKTOK_URL, FACEBOOK_URL, GOOGLE_MAPS_SHORT_URL } from '@/lib/socialLinks';

export const Footer: React.FC = () => {
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());
  const [logoUrl, setLogoUrl] = useState('/assets/brand/logo.png');
  const [realtimeVersion, setRealtimeVersion] = useState(0);

  useEffect(() => {
    async function loadFooter() {
      const [data, activeLogo] = await Promise.all([
        fetchPublicShopSettings(),
        fetchActiveAssetBySection('logo')
      ]);
      if (data) setSettings(data);
      if (data?.logo_url) setLogoUrl(data.logo_url);
      else if (activeLogo?.url) setLogoUrl(activeLogo.url);
    }
    loadFooter();
  }, [realtimeVersion]);

  useShopSettingsRealtime(() => { setRealtimeVersion((version) => version + 1); });
  useSiteAssetsRealtime(() => { setRealtimeVersion((version) => version + 1); });

  return (
    <footer className="bg-[#0A0A0A] text-[#888880] border-t border-brand-gold/20 pt-16 pb-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        {/* Brand Motto column */}
        <div className="space-y-4">
          <Link href="/" className="relative w-36 h-16 block">
            <Image
              src={logoUrl}
              alt={`${settings.shop_name} Logo`}
              fill
              sizes="128px"
              className="object-contain filter brightness-110"
            />
          </Link>
          <p className="font-bebas text-2xl tracking-widest text-[#EDEAE3] pt-2">
            Vioutou t&apos;habille. Tu règnes.
          </p>
          <p className="text-sm text-brand-text-muted leading-relaxed">
            {settings.footer_description}
          </p>
        </div>

        {/* Navigation Categories column */}
        <div>
          <h3 className="font-bebas text-lg tracking-wider text-brand-gold uppercase mb-4">Catégories</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/categorie/basket-pour-homme" className="hover:text-brand-gold transition-colors">
                Baskets pour Homme
              </Link>
            </li>
            <li>
              <Link href="/categorie/complet-pour-homme" className="hover:text-brand-gold transition-colors">
                Complets Streetwear
              </Link>
            </li>
            <li>
              <Link href="/categorie/jean-overside-pour-homme" className="hover:text-brand-gold transition-colors">
                Jeans Oversize
              </Link>
            </li>
            <li>
              <Link href="/categorie/tapettes-pour-homme" className="hover:text-brand-gold transition-colors">
                Claquettes & Sandales
              </Link>
            </li>
          </ul>
        </div>

        {/* Quick Links column */}
        <div>
          <h3 className="font-bebas text-lg tracking-wider text-brand-gold uppercase mb-4">Découvrir</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/looks" className="hover:text-brand-gold transition-colors">
                Looks de Vioutou
              </Link>
            </li>
            <li>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- anchor scroll */}
              <a href="/#testimonials" className="hover:text-brand-gold transition-colors cursor-pointer">
                Avis Clients
              </a>
            </li>
            <li>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- anchor scroll */}
              <a href="/#faq" className="hover:text-brand-gold transition-colors cursor-pointer">
                Foire Aux Questions
              </a>
            </li>
          </ul>
        </div>

        {/* WhatsApp & Benin Info column */}
        <div>
          <h3 className="font-bebas text-lg tracking-wider text-brand-gold uppercase mb-4">Boutique</h3>
          <p className="text-sm leading-relaxed mb-4 flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <span className="flex items-center gap-2">
              {/* Drapeau du Bénin — ratio réel 2:3 (hauteur:largeur) :
                  viewBox 300×200, bande verte au guindant (2/5), jaune en
                  haut et rouge en bas à droite. Taille en rem (h-4 w-6),
                  aligné sur la ligne de texte, liseré discret pour rester
                  lisible sur fond sombre. */}
              <span className="inline-block h-4 w-6 shrink-0 overflow-hidden rounded-[3px] ring-1 ring-inset ring-white/20">
                <svg viewBox="0 0 300 200" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="block h-full w-full">
                  <rect x="0" y="0" width="120" height="200" fill="#008751" />
                  <rect x="120" y="0" width="180" height="100" fill="#FCD116" />
                  <rect x="120" y="100" width="180" height="100" fill="#E8112D" />
                </svg>
              </span>
              <span> {settings.country}</span>
            </span>

            <span className="flex items-center gap-2">
              {/* Icône véhicule */}
              <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-4">
                <path fillRule="evenodd" clipRule="evenodd" d="M3 1L1.66667 5H0V8H1V15H3V13H13V15H15V8H16V5H14.3333L13 1H3ZM4 9C3.44772 9 3 9.44772 3 10C3 10.5523 3.44772 11 4 11C4.55228 11 5 10.5523 5 10C5 9.44772 4.55228 9 4 9ZM11.5585 3H4.44152L3.10819 7H12.8918L11.5585 3ZM12 9C11.4477 9 11 9.44772 11 10C11 10.5523 11.4477 11 12 11C12.5523 11 13 10.5523 13 10C13 9.44772 12.5523 9 12 9Z" fill="#000000"/>
              </svg>
              <span>Livraison {settings.delivery_time} dans tout le pays.</span>
            </span>

            <span>💬 Commandes instantanées via WhatsApp.</span>
          </p>
          <a
            href={`https://wa.me/${settings.whatsapp_phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 bg-brand-gold hover:bg-brand-gold-light text-[#0A0A0A] font-bebas tracking-widest text-sm uppercase rounded transition-colors"
          >
            Discuter sur WhatsApp
          </a>

          {/* MISSION SEO (07/11) — liens officiels : TikTok (vérifié) et
              Google Maps (fiche « HP Collection »). Facebook apparaîtra
              automatiquement dès que son URL permanente sera confirmée
              (src/lib/socialLinks.ts) — aucun lien non vérifié n'est publié. */}
          <div className="flex items-center gap-3 mt-5" aria-label="Présence officielle en ligne">
            <a
              href={TIKTOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="TikTok officiel Perscadors (@perscadors)"
              className="p-2 border border-brand-gold/20 rounded-lg text-[#888880] hover:text-brand-gold hover:border-brand-gold/60 transition-colors"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
            {FACEBOOK_URL ? (
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook officiel Perscadors"
                className="p-2 border border-brand-gold/20 rounded-lg text-[#888880] hover:text-brand-gold hover:border-brand-gold/60 transition-colors"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
            ) : null}
          </div>
          <a
            href={GOOGLE_MAPS_SHORT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 text-sm text-[#888880] hover:text-brand-gold transition-colors"
          >
            <MapPin size={16} className="text-brand-gold" />
            Nous trouver sur Google Maps
          </a>
        </div>
      </div>

      {/* Copyright border bottom */}
      <div className="max-w-7xl mx-auto pt-8 border-t border-brand-gold/10 text-center text-xs text-brand-text-muted flex flex-col sm:flex-row justify-between items-center gap-4">
        <p>© {new Date().getFullYear()} {settings.shop_name}. Tous droits réservés.</p>
        <p>
          Créé pour <span className="text-brand-gold font-semibold">Vioutou</span> | Mode Streetwear Premium {settings.country} 🇧🇯
        </p>
      </div>
    </footer>
  );
};

export default Footer;
