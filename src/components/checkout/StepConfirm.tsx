// src/components/checkout/StepConfirm.tsx
'use client';

import { useState } from 'react';
import { Loader2, MessageSquareCode } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { createOrderFromCart } from '@/services/orderService';
import { generateOrderNumber, buildWhatsAppMessage, openWhatsApp } from '@/services/whatsappService';
import type { CheckoutFormData, CreatedOrder } from '@/admin/types';
import type { OrderItem } from '@/admin/types';

interface Props {
  formData: CheckoutFormData;
  onBack: () => void;
  onSuccess: (order: CreatedOrder) => void;
}

export function StepConfirm({ formData, onBack, onSuccess }: Props) {
  const { cartItems, cartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const DELIVERY_FEE = 0;
  const grandTotal = cartTotal + DELIVERY_FEE;

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);

    const orderNumber = generateOrderNumber();

    const items: OrderItem[] = cartItems.map((item) => ({
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      size: item.selectedSize,
      color: item.selectedColor,
      image: item.product.images[0],
    }));

    const { data, error: orderError } = await createOrderFromCart({
      order_number: orderNumber,
      client_name: formData.client_name,
      client_phone: formData.client_phone,
      client_area: formData.client_area,
      items,
      subtotal: cartTotal,
      delivery_fee: DELIVERY_FEE,
      total: grandTotal,
    });

    if (orderError || !data) {
      setError('Erreur lors de la commande. Réessaie.');
      setLoading(false);
      return;
    }

    const message = buildWhatsAppMessage({
      orderNumber,
      clientName: formData.client_name,
      clientArea: formData.client_area,
      items: cartItems,
      subtotal: cartTotal,
      deliveryFee: DELIVERY_FEE,
      grandTotal,
    });
    openWhatsApp(message);

    clearCart();
    onSuccess(data as CreatedOrder);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="bg-brand-bg-alt rounded-lg border border-brand-gold/10 p-4 space-y-2">
          <p className="font-bebas text-brand-gold tracking-wide">Livraison</p>
          <p className="text-sm">{formData.client_name}</p>
          <p className="text-sm text-brand-text-muted">{formData.client_phone}</p>
          <p className="text-sm text-brand-text-muted">{formData.client_area}</p>
        </div>

        <div className="space-y-2">
          <p className="font-bebas text-brand-gold tracking-wide">Articles ({cartItems.length})</p>
          {cartItems.map((item) => (
            <div
              key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
              className="flex justify-between text-sm"
            >
              <span className="text-brand-text-muted">
                {item.product.name} ×{item.quantity} ({item.selectedSize})
              </span>
              <span>{(item.product.price * item.quantity).toLocaleString()} FCFA</span>
            </div>
          ))}
        </div>

        <div className="border-t border-brand-gold/10 pt-4 space-y-1">
          <div className="flex justify-between text-sm text-brand-text-muted">
            <span>Sous-total</span>
            <span>{cartTotal.toLocaleString()} FCFA</span>
          </div>
          <div className="flex justify-between text-sm text-brand-text-muted">
            <span>Livraison</span>
            <span>À confirmer</span>
          </div>
          <div className="flex justify-between font-bebas text-xl mt-2">
            <span>Total</span>
            <span className="text-brand-gold">{grandTotal.toLocaleString()} FCFA</span>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}
      </div>

      <div className="p-6 border-t border-brand-gold/10 flex gap-3">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex-1 py-4 border border-brand-gold/30 text-brand-text font-bebas text-lg uppercase tracking-widest rounded hover:border-brand-gold transition-all disabled:opacity-40"
        >
          ← Retour
        </button>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="flex-grow py-4 bg-brand-gold hover:bg-brand-gold-light disabled:opacity-40 text-brand-bg font-bebas text-xl uppercase tracking-widest rounded transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <>
              <MessageSquareCode size={20} />
              Valider &amp; Envoyer
            </>
          )}
        </button>
      </div>
    </div>
  );
}