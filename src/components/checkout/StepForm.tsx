// src/components/checkout/StepForm.tsx
// ============================================
// Étape 2 — Informations client et livraison (Intégration Dynamique Supabase)
// ============================================

'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, MapPin, Phone, User, Loader2 } from 'lucide-react';
import { getDefaultShopSettings } from '@/services/settingsService';
import { supabase } from '@/lib/supabase';
import type { CheckoutFormData } from '@/admin/types';

interface StepFormProps {
  defaultValues: CheckoutFormData;
  onNext: (data: CheckoutFormData) => void;
  onBack: () => void;
}

export function StepForm({ defaultValues, onNext, onBack }: StepFormProps) {
  const [form, setForm] = useState<CheckoutFormData>(defaultValues);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({});
  const [deliveryZones, setDeliveryZones] = useState<string[]>(() => 
    getDefaultShopSettings().delivery_zones.map((zone) => zone.name)
  );
  const [isLoadingZones, setIsLoadingZones] = useState<boolean>(true);

  // Pôle 3 : Intégration dynamique des zones de livraison depuis Supabase
  useEffect(() => {
    async function loadDeliveryZones() {
      if (!supabase) {
        setIsLoadingZones(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('shop_settings')
          .select('delivery_zones')
          .single();

        if (!error && data?.delivery_zones && Array.isArray(data.delivery_zones)) {
          // Gère à la fois le format d'objets DeliveryZone[] et de chaînes brutes string[]
          const extractedZones = data.delivery_zones.map((item: unknown) => {
            if (typeof item === 'string') {
              return item;
            }
            if (item && typeof item === 'object' && 'name' in item && typeof (item as { name?: string }).name === 'string') {
              return (item as { name: string }).name;
            }
            return 'Autre';
          });
          if (extractedZones.length > 0) {
            setDeliveryZones(extractedZones);
          }
        }
      } catch (err: unknown) {
        console.error('Erreur chargement des zones de livraison:', err);
      } finally {
        setIsLoadingZones(false);
      }
    }

    loadDeliveryZones();
  }, []);

  const handleFieldChange = (field: keyof CheckoutFormData, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<keyof CheckoutFormData, string>> = {};

    if (!form.client_name.trim()) {
      nextErrors.client_name = 'Le nom complet est requis.';
    }

    if (!form.client_phone.trim()) {
      nextErrors.client_phone = 'Le numéro WhatsApp est requis.';
    } else if (!/^[0-9+\s()-]{8,18}$/.test(form.client_phone.trim())) {
      nextErrors.client_phone = 'Le format du numéro semble invalide.';
    }

    if (!form.client_area.trim()) {
      nextErrors.client_area = 'La zone de livraison est requise.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) {
      return;
    }

    onNext({
      client_name: form.client_name.trim(),
      client_phone: form.client_phone.trim(),
      client_area: form.client_area.trim(),
    });
  };

  return (
    <div className="flex h-full flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
        <div className="rounded-2xl bg-brand-bg-alt border border-brand-gold/10 p-4 shadow-sm">
          <p className="text-sm text-brand-text-muted leading-relaxed font-light">
            Renseigne tes informations pour permettre à l’équipe de préparer la commande et de finaliser le contact sur WhatsApp dans de bonnes conditions.
          </p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-text-muted">
            <User size={14} className="text-brand-gold" />
            Nom complet
          </label>
          <input
            type="text"
            value={form.client_name}
            onChange={(event) => handleFieldChange('client_name', event.target.value)}
            placeholder="Ex: Honoré Perscadors"
            className={`w-full rounded-2xl border bg-brand-bg px-4 py-3 text-brand-text focus:outline-none focus:ring-2 transition-colors shadow-inner ${
              errors.client_name
                ? 'border-red-500 focus:ring-red-500/30'
                : 'border-brand-gold/20 focus:border-brand-gold focus:ring-brand-gold/30'
            }`}
          />
          {errors.client_name && (
            <p className="text-sm text-red-500">{errors.client_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-text-muted">
            <Phone size={14} className="text-brand-gold" />
            Numéro WhatsApp
          </label>
          <input
            type="tel"
            value={form.client_phone}
            onChange={(event) => handleFieldChange('client_phone', event.target.value)}
            placeholder="Ex: +229 67 28 00 18"
            className={`w-full rounded-2xl border bg-brand-bg px-4 py-3 text-brand-text focus:outline-none focus:ring-2 transition-colors shadow-inner ${
              errors.client_phone
                ? 'border-red-500 focus:ring-red-500/30'
                : 'border-brand-gold/20 focus:border-brand-gold focus:ring-brand-gold/30'
            }`}
          />
          {errors.client_phone && (
            <p className="text-sm text-red-500">{errors.client_phone}</p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-brand-text-muted">
              <MapPin size={14} className="text-brand-gold" />
              Zone de livraison
            </label>
            {isLoadingZones && (
              <span className="inline-flex items-center gap-1 text-xs text-brand-gold animate-pulse">
                <Loader2 size={12} className="animate-spin" /> Actualisation...
              </span>
            )}
          </div>

          {/* Premium Interactive Delivery Zone Pills */}
          <div className="flex flex-wrap gap-2">
            {deliveryZones.map((zone) => {
              const isActive = form.client_area === zone;
              return (
                <button
                  key={zone}
                  type="button"
                  onClick={() => handleFieldChange('client_area', zone)}
                  className={`rounded-2xl border px-4 py-2.5 text-sm transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-95 cursor-pointer ${
                    isActive
                      ? 'border-brand-gold bg-brand-gold text-[#0A0A0A] shadow-[0_4px_15px_rgba(184,149,42,0.25)] font-medium scale-[1.02]'
                      : 'border-brand-gold/20 bg-brand-bg text-brand-text hover:border-brand-gold/60 hover:scale-[1.01]'
                  }`}
                >
                  {zone}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={form.client_area}
            onChange={(event) => handleFieldChange('client_area', event.target.value)}
            placeholder="Ex: Cotonou, Agla ou autre précision"
            className={`w-full rounded-2xl border bg-brand-bg px-4 py-3 text-brand-text focus:outline-none focus:ring-2 transition-colors shadow-inner ${
              errors.client_area
                ? 'border-red-500 focus:ring-red-500/30'
                : 'border-brand-gold/20 focus:border-brand-gold focus:ring-brand-gold/30'
            }`}
          />
          {errors.client_area && (
            <p className="text-sm text-red-500">{errors.client_area}</p>
          )}
        </div>
      </div>

      <div className="border-t border-brand-gold/10 bg-brand-bg-alt/80 px-6 py-5 flex gap-3 backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-4 rounded-2xl border border-brand-gold/20 text-brand-text font-bebas uppercase tracking-widest hover:border-brand-gold transition-colors flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <ArrowLeft size={18} />
          Retour
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-[1.25] py-4 rounded-2xl bg-brand-gold text-[#0A0A0A] font-bebas text-xl uppercase tracking-widest hover:bg-brand-gold-light transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(184,149,42,0.25)] hover:shadow-[0_15px_35px_-10px_rgba(184,149,42,0.5)] hover:scale-[1.02] active:scale-[0.98]"
        >
          Confirmer
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
