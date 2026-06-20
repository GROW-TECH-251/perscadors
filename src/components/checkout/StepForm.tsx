// src/components/checkout/StepForm.tsx
'use client';

import { useState } from 'react';
import type { CheckoutFormData } from '@/types';

const ZONES = ['Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Autre'];

interface Props {
  defaultValues: CheckoutFormData;
  onNext: (data: CheckoutFormData) => void;
  onBack: () => void;
}

export function StepForm({ defaultValues, onNext, onBack }: Props) {
  const [form, setForm] = useState<CheckoutFormData>(defaultValues);
  const [errors, setErrors] = useState<Partial<CheckoutFormData>>({});

  const validate = (): boolean => {
    const e: Partial<CheckoutFormData> = {};
    if (!form.client_name.trim()) e.client_name = 'Requis';
    if (!/^[0-9+\s]{8,15}$/.test(form.client_phone.trim()))
      e.client_phone = 'Numéro invalide';
    if (!form.client_area) e.client_area = 'Requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) onNext(form);
  };

  const field = (
    label: string,
    key: keyof CheckoutFormData,
    placeholder: string,
    type = 'text'
  ) => (
    <div>
      <label className="block text-xs text-brand-text-muted mb-1 uppercase tracking-wider">
        {label}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        placeholder={placeholder}
        className={`w-full px-4 py-3 bg-brand-bg border rounded text-brand-text placeholder:text-brand-text-muted/50 focus:outline-none focus:border-brand-gold transition-colors ${
          errors[key] ? 'border-red-500' : 'border-brand-gold/20'
        }`}
      />
      {errors[key] && (
        <p className="text-red-500 text-xs mt-1">{errors[key]}</p>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {field('Nom complet', 'client_name', 'Ex: Kofi Mensah')}
        {field('WhatsApp / Téléphone', 'client_phone', '+229 XX XX XX XX', 'tel')}

        <div>
          <label className="block text-xs text-brand-text-muted mb-1 uppercase tracking-wider">
            Zone de livraison
          </label>
          <select
            value={form.client_area}
            onChange={(e) => setForm({ ...form, client_area: e.target.value })}
            className={`w-full px-4 py-3 bg-brand-bg border rounded text-brand-text focus:outline-none focus:border-brand-gold transition-colors ${
              errors.client_area ? 'border-red-500' : 'border-brand-gold/20'
            }`}
          >
            <option value="">Choisir une zone…</option>
            {ZONES.map((z) => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
          {errors.client_area && (
            <p className="text-red-500 text-xs mt-1">{errors.client_area}</p>
          )}
        </div>
      </div>

      <div className="p-6 border-t border-brand-gold/10 flex gap-3">
        <button
          onClick={onBack}
          className="flex-1 py-4 border border-brand-gold/30 text-brand-text font-bebas text-lg uppercase tracking-widest rounded hover:border-brand-gold transition-all"
        >
          ← Retour
        </button>
        <button
          onClick={handleSubmit}
          className="flex-2 flex-grow py-4 bg-brand-gold hover:bg-brand-gold-light text-brand-bg font-bebas text-xl uppercase tracking-widest rounded transition-all"
        >
          Confirmer →
        </button>
      </div>
    </div>
  );
}