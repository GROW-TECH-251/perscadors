// src/app/admin/reglages/page.tsx
// ============================================
// Réglages boutique opérationnels
// ============================================

'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton, AdminInput, AdminTextarea } from '@/admin/components';
import { Settings, Save, Upload, Trash2, Plus, LogOut } from 'lucide-react';
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
          <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            Configuration boutique
          </span>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase mt-3">Réglages</h1>
          <p className="text-brand-text-muted mt-1">Configuration opérationnelle de la boutique</p>
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
          { id: 'whatsapp', label: 'WhatsApp' },
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
                  className="object-contain"
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
            <AdminButton type="button" variant="secondary" onClick={handleAddZone}>
              <Plus size={16} />
              Ajouter une zone
            </AdminButton>
          </div>

          <div className="space-y-4">
            {settings.delivery_zones.map((zone, index) => (
              <div key={zone.id} className="p-4 bg-brand-bg-alt rounded-xl border border-brand-gold/10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <AdminInput
                    label="Nom"
                    value={zone.name}
                    onChange={(value) => handleZoneChange(index, 'name', value)}
                  />
                  <AdminInput
                    label="Frais (FCFA)"
                    value={zone.fee}
                    onChange={(value) => handleZoneChange(index, 'fee', Number(value) || 0)}
                    type="number"
                  />
                  <AdminInput
                    label="Seuil gratuit (FCFA)"
                    value={zone.freeThreshold}
                    onChange={(value) => handleZoneChange(index, 'freeThreshold', Number(value) || 0)}
                    type="number"
                  />
                  <div className="flex items-end">
                    <AdminButton type="button" variant="danger" onClick={() => handleRemoveZone(index)} className="w-full">
                      <Trash2 size={16} />
                      Supprimer
                    </AdminButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {activeTab === 'whatsapp' && (
        <AdminCard>
          <h2 className="font-bebas text-xl tracking-wider text-brand-text uppercase mb-6">Configuration WhatsApp</h2>
          <div className="space-y-4">
            <AdminInput
              label="Numéro WhatsApp"
              value={settings.whatsapp_phone}
              onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, whatsapp_phone: value }))}
              placeholder="22967280018"
            />
            <AdminTextarea
              label="Template commande en attente"
              value={settings.order_followup_template}
              onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, order_followup_template: value }))}
              rows={3}
            />
            <AdminTextarea
              label="Template commande confirmée"
              value={settings.order_confirmed_template}
              onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, order_confirmed_template: value }))}
              rows={3}
            />
            <AdminTextarea
              label="Template commande livrée"
              value={settings.order_delivered_template}
              onChange={(value) => setSettings((currentSettings) => ({ ...currentSettings, order_delivered_template: value }))}
              rows={3}
            />
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