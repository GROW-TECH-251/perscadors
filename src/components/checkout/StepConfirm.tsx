// src/components/checkout/StepConfirm.tsx
// ============================================
// Étape 3 — Confirmation finale et envoi WhatsApp (Contournement absolu du Bloqueur iOS Safari)
// ============================================

'use client';

import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft, Loader2, MessageCircle, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import {
  buildWhatsAppOrderMessage,
  createOrderFromCart,
  generateIdempotencyKey,
  generateOrderNumber,
  normalizePhoneForWhatsApp,
  type PublicCheckoutPayload,
} from '@/services/orderService';
import type { CheckoutFormData } from '@/types';

const WHATSAPP_DIGITS = process.env.NEXT_PUBLIC_WHATSAPP_PHONE_DIGITS?.trim() || '22967280018';

interface StepConfirmProps {
  formData: CheckoutFormData;
  onBack: () => void;
  onError: (message: string) => void;
  onSuccess: (message: string, orderNumber: string) => void;
}

export function StepConfirm({ formData, onBack, onError, onSuccess }: StepConfirmProps) {
  const { cartItems, cartTotal, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Verrou synchrone : React met l'état à jour de façon asynchrone, ce ref bloque
  // donc un double clic avant le prochain rendu.
  const submissionLockRef = useRef(false);
  // Une tentative et ses retries conservent la même référence et la même clé d'idempotence.
  const pendingOrderRef = useRef<PublicCheckoutPayload | null>(null);

  const orderPreview = useMemo(() => {
    return cartItems.map((item) => ({
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      size: item.selectedSize,
      color: item.selectedColor,
      image: item.product.image_url || item.product.images[0],
    }));
  }, [cartItems]);

  const handleConfirm = async () => {
    if (isSubmitting || submissionLockRef.current) {
      return;
    }

    if (cartItems.length === 0) {
      onError('Le panier est vide, impossible de confirmer la commande.');
      return;
    }

    submissionLockRef.current = true;
    setIsSubmitting(true);
    onError('');

    // Le payload est figé au premier clic. En cas de retry, la référence métier et
    // la clé technique restent identiques, ce qui rend la création idempotente.
    const orderPayload = pendingOrderRef.current || {
      order_number: generateOrderNumber(),
      idempotency_key: generateIdempotencyKey(),
      client_name: formData.client_name,
      client_phone: normalizePhoneForWhatsApp(formData.client_phone),
      client_area: formData.client_area,
      items: orderPreview,
      subtotal: cartTotal,
      delivery_fee: 0,
      total: cartTotal,
    };
    pendingOrderRef.current = orderPayload;

    // Le popup est ouvert dans l'interaction utilisateur, avant toute opération async.
    // C'est indispensable pour Safari iOS et les bloqueurs de popup.
    let targetWindow: Window | null = null;
    if (typeof window !== 'undefined') {
      try {
        targetWindow = window.open('', '_blank');
      } catch {
        // Le repli par location.href est appliqué plus bas.
      }
    }

    let wasPersisted = false;
    try {
      const result = await createOrderFromCart(orderPayload);
      wasPersisted = result.persisted && result.syncStatus === 'synced';
    } catch (error: unknown) {
      // Le service journalise le détail technique. WhatsApp reste le canal de finalisation.
      console.error('Erreur inattendue lors de la préparation de commande:', error);
    }

    // L'envoi WhatsApp reste disponible même si la persistance serveur est indisponible.
    const message = buildWhatsAppOrderMessage(orderPayload);
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${WHATSAPP_DIGITS}?text=${encodedMessage}`;

    if (targetWindow) {
      try {
        targetWindow.location.href = whatsappUrl;
        targetWindow.focus();
      } catch {
        if (typeof window !== 'undefined') {
          window.location.href = whatsappUrl;
        }
      }
    } else if (typeof window !== 'undefined') {
      window.location.href = whatsappUrl;
    }

    clearCart();
    onSuccess(
      wasPersisted
        ? 'Commande enregistrée et transmise sur WhatsApp avec succès !'
        : 'Votre demande est prête et a été transmise sur WhatsApp. Veuillez envoyer le message pour finaliser votre commande.',
      orderPayload.order_number
    );
    setIsSubmitting(false);
  };

  return (
    <div className="flex h-full flex-col min-h-0">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 min-h-0">
        <div className="rounded-2xl border border-brand-gold/10 bg-brand-bg-alt p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-brand-gold">
            <ShieldCheck size={18} />
            <p className="font-bebas text-lg uppercase tracking-wider">Coordonnées client</p>
          </div>
          <div className="space-y-1 text-sm text-brand-text">
            <p><span className="text-brand-text-muted">Nom :</span> {formData.client_name}</p>
            <p><span className="text-brand-text-muted">WhatsApp :</span> {formData.client_phone}</p>
            <p><span className="text-brand-text-muted">Zone :</span> {formData.client_area}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-brand-gold/10 bg-brand-bg-alt p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-brand-gold">
            <Truck size={18} />
            <p className="font-bebas text-lg uppercase tracking-wider">Résumé de commande</p>
          </div>

          <div className="space-y-3">
            {orderPreview.map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-start justify-between gap-4 border-b border-brand-gold/10 pb-3 last:border-none last:pb-0">
                <div>
                  <p className="font-bebas text-base uppercase tracking-wide text-brand-text">{item.name}</p>
                  <p className="text-xs text-brand-text-muted mt-1">
                    Taille {item.size} • {item.color} • Qté {item.quantity}
                  </p>
                </div>
                <p className="font-semibold text-brand-gold text-sm whitespace-nowrap">
                  {(item.price * item.quantity).toLocaleString()} FCFA
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-brand-gold/10 bg-brand-bg p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-sm text-brand-text-muted">
            <span>Sous-total</span>
            <span>{cartTotal.toLocaleString()} FCFA</span>
          </div>
          <div className="flex items-center justify-between text-sm text-brand-text-muted">
            <span>Livraison</span>
            <span>Confirmée sur WhatsApp</span>
          </div>
          <div className="flex items-center justify-between border-t border-brand-gold/10 pt-3">
            <span className="font-bebas text-lg uppercase tracking-wider text-brand-text">Total estimé</span>
            <span className="font-bebas text-2xl text-brand-gold">{cartTotal.toLocaleString()} FCFA</span>
          </div>
        </div>
      </div>

      <div className="border-t border-brand-gold/10 bg-brand-bg-alt/80 px-6 py-5 flex gap-3 backdrop-blur-sm flex-shrink-0">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-4 rounded-2xl border border-brand-gold/20 text-brand-text font-bebas uppercase tracking-widest hover:border-brand-gold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] text-sm sm:text-base"
        >
          <ArrowLeft size={18} />
          Retour
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="flex-[1.25] py-4 rounded-2xl bg-[#25D366] text-white font-bebas text-base sm:text-lg uppercase tracking-widest hover:bg-[#20BA5A] transition-all flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(37,211,102,0.25)] disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Envoi...
            </>
          ) : (
            <>
              <MessageCircle size={18} />
              Valider & envoyer
            </>
          )}
        </button>
      </div>
    </div>
  );
}
