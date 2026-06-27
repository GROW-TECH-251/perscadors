// src/components/checkout/CheckoutDrawer.tsx
// ============================================
// Tunnel de commande premium multi-étapes (Niveau 2 - Animations Fluid)
// ============================================

'use client';

import React, { useMemo, useState, useEffect } from 'react';
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
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const [step, setStep] = useState<CheckoutStep>(1);
  const [formData, setFormData] = useState<CheckoutFormData>(DEFAULT_FORM_DATA);
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState('');
  const [submittedOrderNumber, setSubmittedOrderNumber] = useState('');

  // Premium mounting and CSS transition state machine (asynchronous callbacks)
  useEffect(() => {
    if (isOpen) {
      const mountTimer = window.setTimeout(() => {
        setIsMounted(true);
        window.setTimeout(() => {
          setIsAnimating(true);
        }, 30);
      }, 10);
      return () => window.clearTimeout(mountTimer);
    } else {
      const startCloseTimer = window.setTimeout(() => {
        setIsAnimating(false);
      }, 10);
      
      const completeCloseTimer = window.setTimeout(() => {
        setIsMounted(false);
        // Reset flow after drawer is fully closed
        setStep(1);
        setFormData(DEFAULT_FORM_DATA);
        setCheckoutError('');
        setCheckoutSuccess('');
        setSubmittedOrderNumber('');
      }, 500); // matches duration-[500ms]

      return () => {
        window.clearTimeout(startCloseTimer);
        window.clearTimeout(completeCloseTimer);
      };
    }
  }, [isOpen]);

  const stepTitle = useMemo(() => {
    const currentStep = STEP_LABELS.find((item) => item.step === step);
    return currentStep?.title || 'Commande';
  }, [step]);

  const handleClose = () => {
    setIsAnimating(false);
    onClose();
  };

  const handleCheckoutSuccess = (message: string, orderNumber: string) => {
    setCheckoutError('');
    setCheckoutSuccess(message);
    setSubmittedOrderNumber(orderNumber);

    window.setTimeout(() => {
      handleClose();
    }, 1500);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Premium Backdrop Blur Fade */}
      <div
        className={`fixed inset-0 bg-black/65 backdrop-blur-md z-50 transition-opacity duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
          isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />

      {/* Premium Drawer Slider */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-brand-bg shadow-[0_24px_70px_rgba(10,10,10,0.6)] z-50 transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col border-l border-brand-gold/15 ${
          isAnimating ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="border-b border-brand-gold/15 bg-brand-bg-alt/90 backdrop-blur-md px-6 py-5 space-y-4 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold border border-brand-gold/20">
                Tunnel premium
              </span>
              <h2 className="font-bebas text-2xl sm:text-3xl tracking-wider text-brand-text uppercase mt-3 leading-none">
                {stepTitle}
              </h2>
              <p className="text-sm text-brand-text-muted mt-1 font-light">
                Finalise ta commande avec un parcours simple, clair et assisté.
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2.5 hover:bg-brand-gold/15 rounded-full transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-95 cursor-pointer text-brand-text hover:text-brand-gold"
              type="button"
              aria-label="Fermer le panier"
            >
              <X size={22} />
            </button>
          </div>

          {/* Stepper Display */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {STEP_LABELS.map((item) => {
              const isActive = step === item.step;
              const isDone = step > item.step;

              return (
                <div
                  key={item.step}
                  className={`rounded-2xl border px-3.5 py-3 transition-all duration-400 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                    isActive
                      ? 'border-brand-gold bg-brand-gold/10 shadow-[0_4px_15px_rgba(184,149,42,0.15)] scale-[1.02]'
                      : isDone
                        ? 'border-green-500/30 bg-green-950/20'
                        : 'border-brand-gold/10 bg-brand-bg/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                        isActive
                          ? 'bg-brand-gold text-[#0A0A0A] shadow-md'
                          : isDone
                            ? 'bg-green-500 text-white shadow'
                            : 'bg-brand-bg-alt text-brand-text-muted border border-brand-gold/10'
                      }`}
                    >
                      {isDone ? <CheckCircle2 size={14} className="animate-scale-in" /> : item.step}
                    </span>
                    <span className={`transition-colors duration-300 ${isActive ? 'text-brand-gold' : isDone ? 'text-green-500' : 'text-brand-text-muted'}`}>
                      {item.icon}
                    </span>
                  </div>
                  <p className={`font-bebas text-sm uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-brand-text' : 'text-brand-text-muted'}`}>
                    {item.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {checkoutError && (
          <div className="mx-6 mt-4 rounded-2xl border border-red-800/50 bg-red-950/50 backdrop-blur-sm px-4 py-3.5 text-sm text-red-400 animate-shake flex items-center gap-2.5 shadow-lg">
            <span className="text-lg">⚠️</span>
            <p className="flex-1">{checkoutError}</p>
          </div>
        )}

        {checkoutSuccess && (
          <div className="mx-6 mt-4 rounded-2xl border border-green-500/30 bg-green-950/40 backdrop-blur-sm px-4 py-4 text-sm text-green-400 animate-scale-in shadow-lg space-y-1">
            <div className="flex items-center gap-2 text-green-400 font-semibold">
              <CheckCircle2 size={18} />
              <p>{checkoutSuccess}</p>
            </div>
            {submittedOrderNumber && (
              <p className="text-xs uppercase tracking-widest text-green-500 font-mono pl-6">
                Référence : {submittedOrderNumber}
              </p>
            )}
          </div>
        )}

        {/* Dynamic Step Content Container */}
        <div className="flex-1 min-h-0 relative overflow-hidden flex flex-col">
          {step === 1 && (
            <div className="absolute inset-0 flex flex-col animate-slide-up-fade">
              <StepRecap
                onNext={() => {
                  setCheckoutError('');
                  setStep(2);
                }}
                onClose={handleClose}
              />
            </div>
          )}

          {step === 2 && (
            <div className="absolute inset-0 flex flex-col animate-slide-up-fade">
              <StepForm
                defaultValues={formData}
                onBack={() => setStep(1)}
                onNext={(nextValues) => {
                  setCheckoutError('');
                  setFormData(nextValues);
                  setStep(3);
                }}
              />
            </div>
          )}

          {step === 3 && (
            <div className="absolute inset-0 flex flex-col animate-slide-up-fade">
              <StepConfirm
                formData={formData}
                onBack={() => setStep(2)}
                onError={(message) => setCheckoutError(message)}
                onSuccess={(message, orderNumber) => handleCheckoutSuccess(message, orderNumber)}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}