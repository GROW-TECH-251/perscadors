 'use client';

import { useSiteAssetsRealtime } from '@/hooks/useSiteAssetsRealtime';
import { useShopSettingsRealtime } from '@/hooks/useShopSettingsRealtime';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { fetchPublicShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import { fetchActiveAssetBySection } from '@/services/mediaService';
import type { ShopSettings } from '@/admin/types';

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
              <a href="/#temoinages" className="hover:text-brand-gold transition-colors cursor-pointer">
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
              <span className="inline-block w-10 h-8"> 
                {/* Drapeau personnalisé */}
                <svg width="82" height="70" viewBox="0 0 82 70" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_14_77)">
                    <path d="M72.8889 9.72222H31.8889V35H82V17.5C82 15.4372 81.0401 13.4589 79.3314 12.0003C77.6228 10.5417 75.3053 9.72222 72.8889 9.72222Z" fill="#FCD116"/>
                    <path d="M31.8889 60.2778H72.8889C75.3053 60.2778 77.6228 59.4583 79.3314 57.9997C81.0401 56.5411 82 54.5628 82 52.5V35H31.8889V60.2778Z" fill="#E8112D"/>
                    <path d="M31.8889 9.72222H9.11111C6.69469 9.72222 4.37725 10.5417 2.66858 12.0003C0.959918 13.4589 0 15.4372 0 17.5L0 52.5C0 54.5628 0.959918 56.5411 2.66858 57.9997C4.37725 59.4583 6.69469 60.2778 9.11111 60.2778H31.8889V9.72222Z" fill="#008751"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_14_77">
                      <rect width="82" height="70" fill="white"/>
                    </clipPath>
                  </defs>
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
