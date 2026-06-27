// src/app/admin/reglages/page.tsx
// ============================================
// Réglages boutique opérationnels (Levier 4 : Effet IKEA & Personnalisation WhatsApp)
// ============================================

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton, AdminInput, AdminTextarea } from '@/admin/components';
import { Settings, Save, Upload, Trash2, Plus, LogOut, MessageCircle, Truck, Zap, Share2 } from 'lucide-react';
import { clearAdminSession } from '@/admin/auth';
import { BUCKETS, compressImage, deleteImageByUrl, uploadBrandAsset } from '@/services/mediaService';
import { fetchShopSettings, upsertShopSettings, getDefaultShopSettings } from '@/services/settingsService';
import type { DeliveryZone, ShopSettings } from '@/admin/types';

function createDeliveryZone(): DeliveryZone {
  return {
    id: `zone-${Date.now()}`,
    name: 'Nouvelle zone',
    fee: 1000,
    freeThreshold: 50000
  };
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'delivery' | 'whatsapp' | 'segmentation'>('general');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchShopSettings();
      setSettings(data || getDefaultShopSettings());
    } catch (error: unknown) {
      console.error('Erreur chargement réglages:', error);
      setSettings(getDefaultShopSettings());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadSettings();
    };
    init();
  }, [loadSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await upsertShopSettings(settings);
      if (result.error) {
        alert(result.error);
        return;
      }

      if (result.data) {
        setSettings(result.data);
      }

      alert('Réglages enregistrés avec succès !');
    } catch (error: unknown) {
      console.error('Erreur sauvegarde réglages:', error);
      alert('Erreur lors de la sauvegarde des réglages');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await clearAdminSession();
    router.push('/admin/login');
  };

  const handleZoneChange = (index: number, field: keyof DeliveryZone, value: string | number) => {
    setSettings((currentSettings) => {
      const nextZones = [...currentSettings.delivery_zones];
      nextZones[index] = {
        ...nextZones[index],
        [field]: value
      } as DeliveryZone;

      return {
        ...currentSettings,
        delivery_zones: nextZones
      };
    });
  };

  const handleAddZone = () => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      delivery_zones: [...currentSettings.delivery_zones, createDeliveryZone()]
    }));
  };

  const handleRemoveZone = (index: number) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      delivery_zones: currentSettings.delivery_zones.filter((_, currentIndex) => currentIndex !== index)
    }));
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide.');
      return;
    }

    setUploadingLogo(true);
    try {
      const compressedLogo = await compressImage(file, 1000);
      const result = await uploadBrandAsset(compressedLogo, 'logos/shop-logo');

      if (result.error || !result.data) {
        alert(result.error || 'Erreur lors de l’upload du logo');
        return;
      }

      setSettings((currentSettings) => ({
        ...currentSettings,
        logo_url: result.data || ''
      }));
    } catch (error: unknown) {
      console.error('Erreur upload logo:', error);
      alert('Erreur lors de l’upload du logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!settings.logo_url) {
      return;
    }

    const shouldDelete = window.confirm('Supprimer aussi le logo du stockage Supabase ?');
    if (shouldDelete) {
      const result = await deleteImageByUrl(BUCKETS.BRAND_ASSETS, settings.logo_url);
      if (result.error) {
        alert(result.error);
        return;
      }
    }

    setSettings((currentSettings) => ({
      ...currentSettings,
      logo_url: ''
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement des réglages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold border border-brand-gold/20">
            Personnalisation avancée • Effet IKEA
          </span>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase mt-3">Réglages</h1>
          <p className="text-brand-text-muted mt-1">Configuration opérationnelle et personnalisation des scripts WhatsApp</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AdminButton variant="secondary" onClick={() => router.push('/admin')}>Retour</AdminButton>
          <AdminButton variant="primary" onClick={handleSave} loading={saving || uploadingLogo}>
            <Save size={18} />
            Enregistrer
          </AdminButton>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-brand-gold/20 pb-3">
        {[
          { id: 'general', label: 'Général' },
          { id: 'delivery', label: 'Livraison' },
          { id: 'whatsapp', label: 'WhatsApp & Templates' },
          { id: 'segmentation', label: 'Segmentation' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'bg-brand-gold text-[#0A0A0A]'
                : 'bg-brand-bg-alt text-brand-text hover:bg-brand-gold/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'general' && (
        <AdminCard>
          <div className="flex items-center gap-3 mb-6">
            <Settings size={22} className="text-brand-gold" />
            <h2 className="font-bebas text-xl tracking-wider text-brand-text uppercase">Informations générales</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AdminInput
              label="Nom de la boutique"
              value={settings.shop_name}
              onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, shop_name: value }))}
            />
            <AdminInput
              label="Devise"
              value={settings.currency}
              onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, currency: value }))}
            />
            <AdminInput
              label="Pays"
              value={settings.country}
              onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, country: value }))}
            />
            <AdminInput
              label="Délai affiché"
              value={settings.delivery_time}
              onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, delivery_time: value }))}
              placeholder="24h/48h"
            />
            <AdminInput
              label="Seuil livraison gratuite (FCFA)"
              value={settings.delivery_free_threshold}
              onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, delivery_free_threshold: Number(value) || 0 }))}
              type="number"
            />
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-4">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="hidden"
                id="shop-logo-upload"
              />
              <label
                htmlFor="shop-logo-upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-gold text-[#0A0A0A] rounded-lg cursor-pointer hover:bg-brand-gold-light transition-colors font-medium"
              >
                <Upload size={18} />
                {uploadingLogo ? 'Upload du logo...' : 'Uploader le logo'}
              </label>
              {settings.logo_url && (
                <AdminButton type="button" variant="danger" onClick={handleRemoveLogo}>
                  <Trash2 size={16} />
                  Supprimer le logo
                </AdminButton>
              )}
            </div>

            {settings.logo_url && (
              <div className="relative w-full max-w-xs aspect-video overflow-hidden rounded-xl border border-brand-gold/20 bg-brand-bg">
                <Image
                  src={settings.logo_url}
                  alt="Logo boutique"
                  fill
                  sizes="320px"
                  className="object-contain p-2"
                  unoptimized
                />
              </div>
            )}
          </div>
        </AdminCard>
      )}

      {activeTab === 'delivery' && (
        <AdminCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bebas text-xl tracking-wider text-brand-text uppercase">Zones de livraison</h2>
            <AdminButton variant="primary" size="sm" onClick={handleAddZone}>
              <Plus size={16} />
              Ajouter une zone
            </AdminButton>
          </div>

          <div className="space-y-6">
            {settings.delivery_zones.map((zone, index) => (
              <div key={zone.id || index} className="p-4 bg-brand-bg rounded-xl border border-brand-gold/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bebas text-lg text-brand-text uppercase">Zone #{index + 1}</h3>
                  <button
                    onClick={() => handleRemoveZone(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                    type="button"
                    aria-label="Supprimer zone"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <AdminInput
                    label="Nom de la zone"
                    value={zone.name}
                    onChange={(value) => handleZoneChange(index, 'name', value)}
                  />
                  <AdminInput
                    label="Frais de livraison (FCFA)"
                    value={zone.fee}
                    onChange={(value) => handleZoneChange(index, 'fee', Number(value) || 0)}
                    type="number"
                  />
                  <AdminInput
                    label="Gratuit à partir de (FCFA)"
                    value={zone.freeThreshold}
                    onChange={(value) => handleZoneChange(index, 'freeThreshold', Number(value) || 0)}
                    type="number"
                  />
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* Levier 4 : IKEA Effect & Personnalisation WhatsApp */}
      {activeTab === 'whatsapp' && (
        <AdminCard className="space-y-8">
          <div className="border-b border-brand-gold/15 pb-4">
            <div className="flex items-center gap-3">
              <MessageCircle size={24} className="text-brand-gold" />
              <h2 className="font-bebas text-2xl tracking-wider text-brand-text uppercase">
                Personnalisation WhatsApp & Effet IKEA
              </h2>
            </div>
            <p className="text-sm text-brand-text-muted mt-1">
              Investis dans ton produit en rédigeant tes propres scripts de relance, de story et d&apos;expédition. 
              Mets-y ta personnalité, ton vocabulaire et ton style pour marquer tes clients.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminInput
              label="Numéro WhatsApp Principal (Boutique)"
              value={settings.whatsapp_phone}
              onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, whatsapp_phone: value }))}
              placeholder="Ex: 22967280018"
            />
            <AdminInput
              label="Numéro WhatsApp du Livreur (Optionnel)"
              value={settings.driver_phone || ''}
              onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, driver_phone: value }))}
              placeholder="Ex: 229XXXXXXXX (Pour envoi direct livreur)"
            />
          </div>

          <div className="space-y-6 pt-4 border-t border-brand-gold/10">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-brand-gold font-bebas text-lg uppercase tracking-wider">
                <Share2 size={18} /> Template : Partage en Story WhatsApp
              </div>
              <p className="text-xs text-brand-text-muted">
                Balises disponibles : <code className="text-brand-gold">{"{shopName}"}</code>, <code className="text-brand-gold">{"{productName}"}</code>, <code className="text-brand-gold">{"{productPrice}"}</code>
              </p>
              <AdminTextarea
                value={settings.story_share_template}
                onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, story_share_template: value }))}
                rows={4}
                placeholder="Ex: 🔥 BEST-SELLER {shopName} 🔥..."
              />
            </div>

            <div className="space-y-2 pt-4 border-t border-brand-gold/10">
              <div className="flex items-center gap-2 text-brand-gold font-bebas text-lg uppercase tracking-wider">
                <Zap size={18} /> Template : Relance Magique VIP (Clients dormants)
              </div>
              <p className="text-xs text-brand-text-muted">
                Balises disponibles : <code className="text-brand-gold">{"{shopName}"}</code>, <code className="text-brand-gold">{"{clientName}"}</code>, <code className="text-brand-gold">{"{couponCode}"}</code>
              </p>
              <AdminTextarea
                value={settings.vip_magic_template}
                onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, vip_magic_template: value }))}
                rows={5}
                placeholder="Ex: 👑 {shopName} — OFFRE SECRÈTE VIP 👑..."
              />
            </div>

            <div className="space-y-2 pt-4 border-t border-brand-gold/10">
              <div className="flex items-center gap-2 text-brand-gold font-bebas text-lg uppercase tracking-wider">
                <Truck size={18} /> Template : Expédition au Livreur
              </div>
              <p className="text-xs text-brand-text-muted">
                Balises disponibles : <code className="text-brand-gold">{"{shopName}"}</code>, <code className="text-brand-gold">{"{orderId}"}</code>, <code className="text-brand-gold">{"{clientName}"}</code>, <code className="text-brand-gold">{"{clientPhone}"}</code>, <code className="text-brand-gold">{"{clientArea}"}</code>, <code className="text-brand-gold">{"{itemsList}"}</code>, <code className="text-brand-gold">{"{orderTotal}"}</code>
              </p>
              <AdminTextarea
                value={settings.driver_dispatch_template}
                onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, driver_dispatch_template: value }))}
                rows={6}
                placeholder="Ex: 🚀 MISSION LIVRAISON {shopName} 🚀..."
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-brand-gold/10">
              <h3 className="font-bebas text-lg text-brand-text uppercase tracking-wider">Templates de suivi de commande standards</h3>
              <p className="text-xs text-brand-text-muted">
                Balises disponibles : <code className="text-brand-gold">{"{shopName}"}</code>, <code className="text-brand-gold">{"{clientName}"}</code>, <code className="text-brand-gold">{"{orderId}"}</code>
              </p>
              <AdminTextarea
                label="Message - En attente"
                value={settings.order_followup_template}
                onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, order_followup_template: value }))}
                rows={3}
              />
              <AdminTextarea
                label="Message - Confirmée"
                value={settings.order_confirmed_template}
                onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, order_confirmed_template: value }))}
                rows={3}
              />
              <AdminTextarea
                label="Message - Livrée"
                value={settings.order_delivered_template}
                onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, order_delivered_template: value }))}
                rows={3}
              />
            </div>
          </div>
        </AdminCard>
      )}

      {activeTab === 'segmentation' && (
        <AdminCard>
          <h2 className="font-bebas text-xl tracking-wider text-brand-text uppercase mb-6">Segmentation client</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <AdminInput
              label="Seuil VIP (FCFA)"
              value={settings.customer_segmentation.vip_threshold}
              onChange={(value) => setSettings((currentSettings) => ({
                ...currentSettings,
                customer_segmentation: {
                  ...currentSettings.customer_segmentation,
                  vip_threshold: Number(value) || 0
                }
              }))}
              type="number"
            />
            <AdminInput
              label="Seuil Fidèle (commandes)"
              value={settings.customer_segmentation.loyal_threshold}
              onChange={(value) => setSettings((currentSettings) => ({
                ...currentSettings,
                customer_segmentation: {
                  ...currentSettings.customer_segmentation,
                  loyal_threshold: Number(value) || 0
                }
              }))}
              type="number"
            />
            <AdminInput
              label="Seuil Gros panier (FCFA)"
              value={settings.customer_segmentation.big_cart_threshold}
              onChange={(value) => setSettings((currentSettings) => ({
                ...currentSettings,
                customer_segmentation: {
                  ...currentSettings.customer_segmentation,
                  big_cart_threshold: Number(value) || 0
                }
              }))}
              type="number"
            />
          </div>
        </AdminCard>
      )}

      <AdminCard className="border-l-4 border-l-red-500">
        <h2 className="font-bebas text-xl text-red-600 uppercase mb-4">Zone de danger</h2>
        <p className="text-sm text-brand-text-muted mb-4">
          Utilise cette action uniquement si tu veux fermer ta session administrateur.
        </p>
        <AdminButton variant="danger" onClick={handleLogout}>
          <LogOut size={16} />
          Se déconnecter
        </AdminButton>
      </AdminCard>
    </div>
  );
}
