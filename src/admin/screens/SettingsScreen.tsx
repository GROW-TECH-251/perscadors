// src/admin/screens/SettingsScreen.tsx
// ============================================
// Écran des paramètres de la boutique
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import { AdminCard, AdminButton, AdminInput, AdminTextarea, AdminSelect } from '../components';
import { Settings, Save, Phone, MapPin, DollarSign, MessageCircle, Truck, UserCheck } from 'lucide-react';
import { fetchShopSettings, upsertShopSettings } from '@/services/settingsService';
import type { ShopSettings, DeliveryZone, AdminScreen } from '@/admin/types';

interface SettingsScreenProps {
  onBack: () => void;
  onNavigate: (screen: AdminScreen) => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack, onNavigate, onLogout }) => {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'delivery' | 'whatsapp' | 'segmentation'>('general');

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchShopSettings();
      setSettings(data);
    } catch (err: unknown) {
      console.error('Erreur chargement paramètres:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await loadSettings();
    };
    load();
  }, [loadSettings]);

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      await upsertShopSettings(settings);
      alert('Paramètres enregistrés !');
    } catch (err: unknown) {
      console.error('Erreur sauvegarde paramètres:', err);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDeliveryZone = () => {
    if (!settings) return;
    
    const newZone: DeliveryZone = {
      id: `zone-${Date.now()}`,
      name: 'Nouvelle zone',
      fee: 1000,
      freeThreshold: 50000
    };

    setSettings({
      ...settings,
      delivery_zones: [...settings.delivery_zones, newZone]
    });
  };

  const handleUpdateDeliveryZone = (index: number, field: keyof DeliveryZone, value: string | number) => {
    if (!settings) return;

    const updated = [...settings.delivery_zones];
    updated[index] = { ...updated[index], [field]: value };

    setSettings({
      ...settings,
      delivery_zones: updated
    });
  };

  const handleRemoveDeliveryZone = (index: number) => {
    if (!settings) return;

    setSettings({
      ...settings,
      delivery_zones: settings.delivery_zones.filter((_, i) => i !== index)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement des paramètres...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-brand-text-muted">Impossible de charger les paramètres</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">
            Réglages
          </h1>
          <p className="text-brand-text-muted mt-1">
            Configuration de la boutique
          </p>
        </div>
        <div className="flex gap-3">
          <AdminButton variant="secondary" onClick={onBack}>
            Retour
          </AdminButton>
          <AdminButton variant="primary" onClick={handleSave} loading={saving}>
            <Save size={20} />
            Enregistrer
          </AdminButton>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-brand-gold/20">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'general'
              ? 'text-brand-gold border-b-2 border-brand-gold'
              : 'text-brand-text-muted hover:text-brand-text'
          }`}
        >
          <Settings size={16} className="inline mr-2" />
          Général
        </button>
        <button
          onClick={() => setActiveTab('delivery')}
          className={`px-4 py-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'delivery'
              ? 'text-brand-gold border-b-2 border-brand-gold'
              : 'text-brand-text-muted hover:text-brand-text'
          }`}
        >
          <Truck size={16} className="inline mr-2" />
          Livraison
        </button>
        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'whatsapp'
              ? 'text-brand-gold border-b-2 border-brand-gold'
              : 'text-brand-text-muted hover:text-brand-text'
          }`}
        >
          <MessageCircle size={16} className="inline mr-2" />
          WhatsApp
        </button>
        <button
          onClick={() => setActiveTab('segmentation')}
          className={`px-4 py-2 font-medium transition-colors cursor-pointer ${
            activeTab === 'segmentation'
              ? 'text-brand-gold border-b-2 border-brand-gold'
              : 'text-brand-text-muted hover:text-brand-text'
          }`}
        >
          <UserCheck size={16} className="inline mr-2" />
          Segmentation
        </button>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-6">
            Informations générales
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AdminInput
              label="Nom de la boutique"
              value={settings.shop_name}
              onChange={(v) => setSettings({ ...settings, shop_name: v })}
            />
            <AdminInput
              label="Devise"
              value={settings.currency}
              onChange={(v) => setSettings({ ...settings, currency: v })}
            />
            <AdminInput
              label="Pays"
              value={settings.country}
              onChange={(v) => setSettings({ ...settings, country: v })}
            />
            <AdminInput
              label="Logo URL"
              value={settings.logo_url || ''}
              onChange={(v) => setSettings({ ...settings, logo_url: v })}
              placeholder="https://..."
            />
          </div>
        </AdminCard>
      )}

      {/* Delivery Settings */}
      {activeTab === 'delivery' && (
        <>
          <AdminCard>
            <h2 className="font-bebas text-xl text-brand-text uppercase mb-6">
              Zones de livraison
            </h2>
            <div className="space-y-4">
              {settings.delivery_zones.map((zone, index) => (
                <div key={zone.id} className="p-4 bg-brand-bg-alt rounded-lg border border-brand-gold/10">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                    <AdminInput
                      label="Nom de la zone"
                      value={zone.name}
                      onChange={(v) => handleUpdateDeliveryZone(index, 'name', v)}
                    />
                    <AdminInput
                      label="Frais (FCFA)"
                      value={zone.fee}
                      onChange={(v) => handleUpdateDeliveryZone(index, 'fee', Number(v) || 0)}
                      type="number"
                    />
                    <AdminInput
                      label="Seuil gratuit (FCFA)"
                      value={zone.freeThreshold}
                      onChange={(v) => handleUpdateDeliveryZone(index, 'freeThreshold', Number(v) || 0)}
                      type="number"
                    />
                    <div className="flex items-end">
                      <AdminButton
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveDeliveryZone(index)}
                        className="w-full"
                      >
                        Supprimer
                      </AdminButton>
                    </div>
                  </div>
                </div>
              ))}

              <AdminButton
                type="button"
                variant="secondary"
                onClick={handleAddDeliveryZone}
              >
                <Save size={16} className="rotate-45" />
                Ajouter une zone
              </AdminButton>
            </div>
          </AdminCard>

          <AdminCard>
            <h2 className="font-bebas text-xl text-brand-text uppercase mb-6">
              Délais de livraison
            </h2>
            <AdminInput
              label="Délai affiché"
              value={settings.delivery_time}
              onChange={(v) => setSettings({ ...settings, delivery_time: v })}
              placeholder="24h/48h"
            />
          </AdminCard>
        </>
      )}

      {/* WhatsApp Settings */}
      {activeTab === 'whatsapp' && (
        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-6">
            Configuration WhatsApp
          </h2>
          <div className="space-y-6">
            <AdminInput
              label="Numéro WhatsApp"
              value={settings.whatsapp_phone}
              onChange={(v) => setSettings({ ...settings, whatsapp_phone: v })}
              placeholder="22967280018"
            />

            <div className="space-y-4">
              <h3 className="font-bebas text-lg text-brand-text uppercase">
                Templates de messages
              </h3>

              <AdminTextarea
                label="Message - Commande en attente"
                value={settings.order_followup_template}
                onChange={(v) => setSettings({ ...settings, order_followup_template: v })}
                rows={3}
              />

              <AdminTextarea
                label="Message - Commande confirmée"
                value={settings.order_confirmed_template}
                onChange={(v) => setSettings({ ...settings, order_confirmed_template: v })}
                rows={3}
              />

              <AdminTextarea
                label="Message - Commande livrée"
                value={settings.order_delivered_template}
                onChange={(v) => setSettings({ ...settings, order_delivered_template: v })}
                rows={3}
              />
            </div>

            <div className="p-4 bg-brand-bg-alt rounded-lg border border-brand-gold/10">
              <p className="text-sm text-brand-text-muted mb-2">Variables disponibles :</p>
              <div className="flex gap-4 text-xs font-mono">
                <span className="text-brand-gold">{`{shopName}`}</span>
                <span className="text-brand-gold">{`{clientName}`}</span>
                <span className="text-brand-gold">{`{orderId}`}</span>
              </div>
            </div>
          </div>
        </AdminCard>
      )}

      {/* Customer Segmentation */}
      {activeTab === 'segmentation' && (
        <AdminCard>
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-6">
            Segmentation clients
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdminInput
              label="Seuil VIP (FCFA)"
              value={settings.customer_segmentation.vip_threshold}
              onChange={(v) => setSettings({
                ...settings,
                customer_segmentation: {
                  ...settings.customer_segmentation,
                  vip_threshold: Number(v) || 0
                }
              })}
              type="number"
            />
            <AdminInput
              label="Seuil Fidèle (commandes)"
              value={settings.customer_segmentation.loyal_threshold}
              onChange={(v) => setSettings({
                ...settings,
                customer_segmentation: {
                  ...settings.customer_segmentation,
                  loyal_threshold: Number(v) || 0
                }
              })}
              type="number"
            />
            <AdminInput
              label="Seuil Gros panier (FCFA)"
              value={settings.customer_segmentation.big_cart_threshold}
              onChange={(v) => setSettings({
                ...settings,
                customer_segmentation: {
                  ...settings.customer_segmentation,
                  big_cart_threshold: Number(v) || 0
                }
              })}
              type="number"
            />
          </div>

          <div className="mt-6 p-4 bg-brand-bg-alt rounded-lg border border-brand-gold/10">
            <h3 className="font-bebas text-sm text-brand-text uppercase mb-3">
              Segments automatiques
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
              <div className="p-3 bg-purple-100 text-purple-700 rounded">
                <strong>VIP</strong> : Total ≥ {settings.customer_segmentation.vip_threshold.toLocaleString()} FCFA
              </div>
              <div className="p-3 bg-blue-100 text-blue-700 rounded">
                <strong>Fidèle</strong> : ≥ {settings.customer_segmentation.loyal_threshold} commandes
              </div>
              <div className="p-3 bg-orange-100 text-orange-700 rounded">
                <strong>Gros panier</strong> : Panier moyen ≥ {settings.customer_segmentation.big_cart_threshold.toLocaleString()} FCFA
              </div>
              <div className="p-3 bg-green-100 text-green-700 rounded">
                <strong>Nouveau</strong> : 1ère commande
              </div>
              <div className="p-3 bg-yellow-100 text-yellow-700 rounded">
                <strong>À relancer</strong> : Dernière commande en attente
              </div>
              <div className="p-3 bg-gray-100 text-gray-700 rounded">
                <strong>Standard</strong> : Aucun critère spécial
              </div>
            </div>
          </div>
        </AdminCard>
      )}

      {/* Danger Zone */}
      <AdminCard className="border-l-4 border-l-red-500">
        <h2 className="font-bebas text-xl text-red-600 uppercase mb-4">
          Zone de danger
        </h2>
        <p className="text-sm text-brand-text-muted mb-4">
          Ces actions sont irréversibles. Soyez certain de vouloir les effectuer.
        </p>
        <div className="flex gap-4">
          <AdminButton variant="danger" onClick={onLogout}>
            Se déconnecter
          </AdminButton>
        </div>
      </AdminCard>
    </div>
  );
};