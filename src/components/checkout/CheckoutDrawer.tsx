// src/components/checkout/CheckoutDrawer.tsx
// ============================================
// Tunnel de commande premium multi-étapes
// ============================================

'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, ShoppingBag, Truck, ShieldCheck, X } from 'lucide-react';
import { StepRecap } from './StepRecap';
import { StepForm } from './StepForm';
import { StepConfirm } from './StepConfirm';
import type { CheckoutFormData, CheckoutStep } from '@/types';

interface CheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEP_LABELS: Array<{ step: CheckoutStep; title: string; icon: React.ReactNode }> = [
  { step: 1, title: 'Panier', icon: <ShoppingBag size={16} /> },
  { step: 2, title: 'Livraison', icon: <Truck size={16} /> },
  { step: 3, title: 'Confirmation', icon: <ShieldCheck size={16} /> },
];

const DEFAULT_FORM_DATA: CheckoutFormData = {
  client_name: '',
  client_phone: '',
  client_area: '',
};

export function CheckoutDrawer({ isOpen, onClose }: CheckoutDrawerProps) {
  const [step, setStep] = useState<CheckoutStep>(1);
  const [formData, setFormData] = useState<CheckoutFormData>(DEFAULT_FORM_DATA);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState('');
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState('');

  const stepTitle = useMemo(() => {
    const currentStep = STEP_LABELS.find((item) => item.step === step);
    return currentStep?.title || 'Commande';
  }, [step]);

  const resetFlow = () => {
    setStep(1);
    setFormData(DEFAULT_FORM_DATA);
    setCheckoutError('');
    setCheckoutSuccess('');
    setSubmittedOrderNumber('');
  };

  const handleClose = () => {
    onClose();
    window.setTimeout(() => {
      resetFlow();
    }, 250);
  };

  const handleCheckoutSuccess = (message: string, orderNumber: string) => {
    setCheckoutError('');
    setCheckoutSuccess(message);
    setSubmittedOrderNumber(orderNumber);

    window.setTimeout(() => {
      handleClose();
    }, 1400);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleClose}
      />

      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-brand-bg shadow-[0_24px_60px_rgba(10,10,10,0.22)] z-50 transform transition-transform duration-300 flex flex-col border-l border-brand-gold/10">
        <div className="border-b border-brand-gold/10 bg-brand-bg-alt/80 backdrop-blur-sm px-6 py-5 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold">
                Tunnel premium
              </span>
              <h2 className="font-bebas text-2xl tracking-wider text-brand-text uppercase mt-3">
                {stepTitle}
              </h2>
              <p className="text-sm text-brand-text-muted mt-1">
                Finalise ta commande avec un parcours simple, clair et assisté.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-brand-gold/10 rounded-full transition-colors cursor-pointer"
              type="button"
              aria-label="Fermer le panier"
            >
              <X size={22} className="text-brand-text" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {STEP_LABELS.map((item) => {
              const isActive = step === item.step;
              const isDone = step > item.step;

              return (
                <div
                  key={item.step}
                  className={`rounded-2xl border px-3 py-3 transition-all ${
                    isActive
                      ? 'border-brand-gold bg-brand-gold/10 shadow-sm'
                      : isDone
                        ? 'border-green-300 bg-green-50'
                        : 'border-brand-gold/10 bg-brand-bg'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                        isActive
                          ? 'bg-brand-gold text-[#0A0A0A]'
                          : isDone
                            ? 'bg-green-500 text-white'
                            : 'bg-brand-bg-alt text-brand-text-muted'
                      }`}
                    >
                      {isDone ? <CheckCircle2 size={14} /> : item.step}
                    </span>
                    <span className={`${isActive ? 'text-brand-gold' : isDone ? 'text-green-600' : 'text-brand-text-muted'}`}>
                      {item.icon}
                    </span>
                  </div>
                  <p className={`font-bebas text-sm uppercase tracking-wider ${isActive ? 'text-brand-text' : 'text-brand-text-muted'}`}>
                    {item.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {checkoutError && (
          <div className="mx-6 mt-4 rounded-2xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {checkoutError}
          </div>
        )}

        {checkoutSuccess && (
          <div className="mx-6 mt-4 rounded-2xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-700">
            <p className="font-semibold">{checkoutSuccess}</p>
            {submittedOrderNumber && (
              <p className="mt-1 text-xs uppercase tracking-wider text-green-800">
                Référence : {submittedOrderNumber}
              </p>
            )}
          </div>
        )}

        <div className="flex-1 min-h-0">
          {step === 1 && (
            <StepRecap
              onNext={() => {
                setCheckoutError('');
                setStep(2);
              }}
              onClose={handleClose}
            />
          )}

          {step === 2 && (
            <StepForm
              defaultValues={formData}
              onBack={() => setStep(1)}
              onNext={(nextValues) => {
                setCheckoutError('');
                setFormData(nextValues);
                setStep(3);
              }}
            />
          )}

          {step === 3 && (
            <StepConfirm
              formData={formData}
              onBack={() => setStep(2)}
              onError={(message) => setCheckoutError(message)}
              onSuccess={(message, orderNumber) => handleCheckoutSuccess(message, orderNumber)}
            />
          )}
        </div>
      </div>
    </>
  );
}