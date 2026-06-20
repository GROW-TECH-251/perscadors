// src/components/checkout/CheckoutDrawer.tsx
'use client';

import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { StepRecap } from './StepRecap';
import { StepForm } from './StepForm';
import { StepConfirm } from './StepConfirm';
import type { CheckoutFormData, CheckoutStep, CreatedOrder } from '@/types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const STEP_LABELS = ['Panier', 'Livraison', 'Confirmation'];

const DEFAULT_FORM: CheckoutFormData = {
  client_name: '',
  client_phone: '',
  client_area: '',
};

export function CheckoutDrawer({ isOpen, onClose }: Props) {
  const [step, setStep] = useState<CheckoutStep>(1);
  const [formData, setFormData] = useState<CheckoutFormData>(DEFAULT_FORM);
  const [completedOrder, setCompletedOrder] = useState<CreatedOrder | null>(null);

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep(1);
      setFormData(DEFAULT_FORM);
      setCompletedOrder(null);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="absolute inset-y-0 right-0 flex pl-10 max-w-full">
        <div className="w-screen max-w-md bg-brand-bg text-brand-text flex flex-col border-l border-brand-gold/20 shadow-2xl">

          <div className="p-6 border-b border-brand-gold/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bebas text-brand-gold tracking-wider">
                {completedOrder ? 'Commande envoyée' : 'Commander'}
              </h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-brand-bg-alt rounded-full transition-colors text-brand-text-muted hover:text-brand-text"
              >
                <X size={20} />
              </button>
            </div>

            {!completedOrder && (
              <div className="flex items-center gap-2">
                {STEP_LABELS.map((label, i) => {
                  const s = (i + 1) as CheckoutStep;
                  const active = step === s;
                  const done = step > s;
                  return (
                    <div key={s} className="flex items-center gap-2 flex-1">
                      <div className={`flex items-center gap-1.5 ${active ? 'text-brand-gold' : done ? 'text-green-400' : 'text-brand-text-muted'}`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border ${
                          active ? 'border-brand-gold bg-brand-gold text-brand-bg' :
                          done ? 'border-green-400 bg-green-400 text-brand-bg' :
                          'border-brand-text-muted'
                        }`}>
                          {done ? '✓' : s}
                        </div>
                        <span className="text-xs font-medium hidden sm:block">{label}</span>
                      </div>
                      {i < STEP_LABELS.length - 1 && (
                        <div className={`flex-1 h-px ${done ? 'bg-green-400' : 'bg-brand-gold/20'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {completedOrder ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
                <CheckCircle2 size={64} className="text-green-400" />
                <h3 className="font-bebas text-2xl tracking-wide">Commande envoyée !</h3>
                <p className="text-brand-text-muted text-sm">
                  Ton message WhatsApp a été ouvert. Vioutou va confirmer ta commande.
                </p>
                <div className="bg-brand-bg-alt rounded-lg p-4 w-full text-left space-y-1">
                  <p className="text-xs text-brand-text-muted uppercase tracking-wider">Référence</p>
                  <p className="font-bebas text-brand-gold text-lg tracking-wide">
                    {completedOrder.order_number}
                  </p>
                </div>
                <a
                  href={`/order/${completedOrder.public_token}`}
                  className="w-full py-3 border border-brand-gold/30 text-brand-gold font-bebas text-lg uppercase tracking-widest rounded hover:border-brand-gold transition-all text-center block"
                >
                  Suivre ma commande
                </a>
                <button
                  onClick={handleClose}
                  className="w-full py-3 bg-brand-gold hover:bg-brand-gold-light text-brand-bg font-bebas text-lg uppercase tracking-widest rounded transition-all"
                >
                  Fermer
                </button>
              </div>
            ) : step === 1 ? (
              <StepRecap onNext={() => setStep(2)} />
            ) : step === 2 ? (
              <StepForm
                defaultValues={formData}
                onBack={() => setStep(1)}
                onNext={(data) => { setFormData(data); setStep(3); }}
              />
            ) : (
              <StepConfirm
                formData={formData}
                onBack={() => setStep(2)}
                onSuccess={(order) => setCompletedOrder(order)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}