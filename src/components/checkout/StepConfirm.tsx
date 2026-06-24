// src/components/checkout/StepConfirm.tsx
// ============================================
// Étape 3 — Confirmation finale et envoi WhatsApp
// ============================================

'use client';

import React, { useMemo, useState } from 'react';
import { ArrowLeft, Loader2, MessageCircle, ShieldCheck, Truck } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  buildWhatsAppOrderMessage,
  createOrderFromCart,
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
    if (cartItems.length === 0) {
      onError('Le panier est vide, impossible de confirmer la commande.');
      return;
    }

    setIsSubmitting(true);
    onError('');

    const orderNumber = generateOrderNumber();
    const orderPayload: PublicCheckoutPayload = {
      order_number: orderNumber,
      client_name: formData.client_name,
      client_phone: normalizePhoneForWhatsApp(formData.client_phone),
      client_area: formData.client_area,
      items: orderPreview,
      subtotal: cartTotal,
      delivery_fee: 0,
      total: cartTotal,
    };

    const whatsappWindow = typeof window !== 'undefined'
      ? window.open('', '_blank', 'noopener,noreferrer')
      : null;

    try {
      if (isSupabaseConfigured) {
        const creationResult = await createOrderFromCart(orderPayload);

        if (creationResult.error) {
          whatsappWindow?.close();
          onError(`La commande n'a pas pu être enregistrée dans l'admin : ${creationResult.error}`);
          return;
        }
      }

      const message = buildWhatsAppOrderMessage(orderPayload);
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/${WHATSAPP_DIGITS}?text=${encodedMessage}`;

      if (whatsappWindow) {
        whatsappWindow.location.href = whatsappUrl;
      } else {
        window.open(whatsappUrl, '_blank');
      }

      clearCart();
      onSuccess(
        isSupabaseConfigured
          ? 'Commande enregistrée dans le dashboard et envoyée sur WhatsApp.'
          : 'Commande préparée et envoyée sur WhatsApp. Configure Supabase pour la voir remonter dans l’admin.',
        orderNumber
      );
    } catch (error: unknown) {
      whatsappWindow?.close();
      console.error('Erreur confirmation checkout:', error);
      onError('Une erreur est survenue pendant la confirmation de la commande.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
        <div className="rounded-2xl border border-brand-gold/10 bg-brand-bg-alt p-4 space-y-3">
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

        <div className="rounded-2xl border border-brand-gold/10 bg-brand-bg-alt p-4 space-y-3">
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

        <div className="rounded-2xl border border-brand-gold/10 bg-brand-bg p-4 space-y-2">
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

      <div className="border-t border-brand-gold/10 bg-brand-bg-alt/80 px-6 py-5 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="flex-1 py-4 rounded-2xl border border-brand-gold/20 text-brand-text font-bebas uppercase tracking-widest hover:border-brand-gold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ArrowLeft size={18} />
          Retour
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="flex-[1.25] py-4 rounded-2xl bg-[#25D366] text-white font-bebas text-lg uppercase tracking-widest hover:bg-[#20BA5A] transition-all flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(37,211,102,0.25)] disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Préparation...
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