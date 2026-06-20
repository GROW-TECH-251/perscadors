// src/components/checkout/StepRecap.tsx
'use client';

import Image from 'next/image';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface Props {
  onNext: () => void;
}

export function StepRecap({ onNext }: Props) {
  const { cartItems, updateQuantity, removeFromCart, cartTotal } = useCart();
  const DELIVERY_FEE = 0;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {cartItems.map((item) => (
          <div
            key={`${item.product.id}-${item.selectedSize}-${item.selectedColor}`}
            className="flex gap-4 p-3 bg-brand-bg-alt rounded-lg border border-brand-gold/5"
          >
            <div className="relative w-20 h-24 rounded overflow-hidden flex-shrink-0">
              <Image
                src={item.product.images[0]}
                alt={item.product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <p className="font-bebas text-lg tracking-wide">{item.product.name}</p>
                <p className="text-xs text-brand-text-muted mt-1">
                  {item.selectedSize} · {item.selectedColor}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center border border-brand-gold/20 rounded bg-brand-bg">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity - 1)}
                    className="px-2 py-1 text-brand-text-muted hover:text-brand-text"
                  >
                    <Minus size={12} />
                  </button>
                  <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.selectedSize, item.selectedColor, item.quantity + 1)}
                    className="px-2 py-1 text-brand-text-muted hover:text-brand-text"
                  >
                    <Plus size={12} />
                  </button>
                </div>
                <span className="text-brand-gold font-semibold text-sm">
                  {(item.product.price * item.quantity).toLocaleString()} FCFA
                </span>
              </div>
            </div>
            <button
              onClick={() => removeFromCart(item.product.id, item.selectedSize, item.selectedColor)}
              className="self-start p-1 text-brand-text-muted hover:text-red-500"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-brand-gold/10 space-y-4">
        <div className="flex justify-between text-sm text-brand-text-muted">
          <span>Sous-total</span>
          <span>{cartTotal.toLocaleString()} FCFA</span>
        </div>
        <div className="flex justify-between text-sm text-brand-text-muted">
          <span>Livraison</span>
          <span>À confirmer</span>
        </div>
        <div className="flex justify-between font-bebas text-xl">
          <span>Total estimé</span>
          <span className="text-brand-gold">{cartTotal.toLocaleString()} FCFA</span>
        </div>
        <button
          onClick={onNext}
          disabled={cartItems.length === 0}
          className="w-full py-4 bg-brand-gold hover:bg-brand-gold-light disabled:opacity-40 disabled:cursor-not-allowed text-brand-bg font-bebas text-xl uppercase tracking-widest rounded transition-all"
        >
          Continuer →
        </button>
      </div>
    </div>
  );
}