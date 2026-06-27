'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { requireSupabase } from '@/lib/supabase';
import { PublicLayout } from '@/components/layout/PublicLayout';
import { Package, Truck, CheckCircle2, XCircle, Clock, MessageCircle, ArrowLeft } from 'lucide-react';

interface TrackedOrder {
  order_number: string;
  client_name: string;
  client_phone: string;
  status: string;
  total: number;
  created_at: string;
}

export default function OrderTrackingPage() {
  const params = useParams<{ token: string }>();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrder() {
      if (!params?.token) return;

      try {
        const supabase = requireSupabase();
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('order_number', params.token)
          .single();

        if (fetchError || !data) {
          setError('Commande introuvable ou numéro de suivi invalide.');
        } else {
          setOrder(data as TrackedOrder);
        }
      } catch (err: unknown) {
        console.error('Erreur de suivi de commande:', err);
        setError('Erreur de chargement des données de la commande.');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [params?.token]);

  const getStatusDisplay = (status: string) => {
    const normalized = status?.toUpperCase() || 'EN ATTENTE';
    switch (normalized) {
      case 'CONFIRMÉE':
        return {
          label: 'CONFIRMÉE',
          icon: <CheckCircle2 size={18} className="text-emerald-400" />,
          classes: 'bg-emerald-950/50 text-emerald-400 border-emerald-800/50',
        };
      case 'EN LIVRAISON':
        return {
          label: 'EN LIVRAISON',
          icon: <Truck size={18} className="text-blue-400 animate-bounce" />,
          classes: 'bg-blue-950/50 text-blue-400 border-blue-800/50',
        };
      case 'LIVRÉE':
        return {
          label: 'LIVRÉE',
          icon: <Package size={18} className="text-brand-gold" />,
          classes: 'bg-brand-gold/10 text-brand-gold border-brand-gold/30',
        };
      case 'ANNULÉE':
        return {
          label: 'ANNULÉE',
          icon: <XCircle size={18} className="text-red-400" />,
          classes: 'bg-red-950/50 text-red-400 border-red-800/50',
        };
      default:
        return {
          label: 'EN ATTENTE',
          icon: <Clock size={18} className="text-amber-400 animate-pulse" />,
          classes: 'bg-amber-950/50 text-amber-400 border-amber-800/50',
        };
    }
  };

  if (loading) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-32 min-h-[80vh] flex flex-col justify-center">
          <div className="text-center mb-12 space-y-3">
            <div className="h-4 w-32 bg-brand-gold/20 rounded-full mx-auto animate-pulse" />
            <div className="h-10 w-64 bg-brand-bg-alt rounded-2xl mx-auto animate-pulse" />
            <div className="w-16 h-1 bg-brand-gold/40 mx-auto animate-pulse" />
          </div>

          {/* Premium Luxury Skeleton Screen */}
          <div className="bg-brand-bg-alt border border-brand-gold/15 rounded-3xl shadow-[0_25px_60px_rgba(10,10,10,0.45)] p-8 space-y-8 backdrop-blur-sm animate-pulse">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-brand-gold/20 rounded-full" />
              <div className="h-8 w-48 bg-brand-bg rounded-xl" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-brand-gold/10">
              <div className="space-y-2">
                <div className="h-3 w-20 bg-brand-gold/20 rounded-full" />
                <div className="h-6 w-36 bg-brand-bg rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-24 bg-brand-gold/20 rounded-full" />
                <div className="h-6 w-32 bg-brand-bg rounded-xl" />
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t border-brand-gold/10">
              <div className="h-3 w-16 bg-brand-gold/20 rounded-full" />
              <div className="h-8 w-32 bg-brand-bg rounded-full" />
            </div>

            <div className="pt-6 border-t border-brand-gold/15 flex justify-between items-center">
              <div className="h-4 w-16 bg-brand-gold/20 rounded-full" />
              <div className="h-8 w-40 bg-brand-gold/30 rounded-xl" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (error || !order) {
    return (
      <PublicLayout>
        <div className="max-w-lg mx-auto px-4 sm:px-6 py-32 min-h-[75vh] flex items-center justify-center">
          <div className="w-full bg-brand-bg-alt border border-brand-gold/15 rounded-3xl shadow-[0_25px_60px_rgba(10,10,10,0.5)] p-8 text-center space-y-6 backdrop-blur-sm animate-scale-in">
            <XCircle size={56} className="text-red-500 mx-auto animate-shake" />
            <div>
              <h1 className="font-bebas text-4xl sm:text-5xl text-brand-text tracking-wider uppercase mb-2">
                Commande introuvable
              </h1>
              <p className="text-sm sm:text-base text-brand-text-muted leading-relaxed">
                {error || "Le numéro de suivi indiqué ne correspond à aucune commande active dans notre système."}
              </p>
            </div>
            <div className="pt-4 border-t border-brand-gold/10">
              <Link
                href="/"
                className="w-full py-4 bg-brand-gold hover:bg-brand-gold-light text-[#0A0A0A] font-bebas text-xl uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_rgba(184,149,42,0.3)] transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ArrowLeft size={18} />
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const statusDisplay = getStatusDisplay(order.status);

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-32 min-h-[85vh]">
        <div className="text-center mb-12 space-y-3 animate-slide-up-fade">
          <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold border border-brand-gold/20">
            Espace Client
          </span>
          <h1 className="font-bebas text-4xl sm:text-6xl tracking-wider text-brand-text uppercase leading-none">
            Suivi de commande
          </h1>
          <div className="w-20 h-1 bg-brand-gold mx-auto" />
        </div>

        {/* Immersive Premium Tracked Order Card */}
        <div className="bg-brand-bg-alt border border-brand-gold/15 rounded-3xl shadow-[0_25px_60px_rgba(10,10,10,0.45)] p-6 sm:p-10 space-y-8 backdrop-blur-sm animate-scale-in relative">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-text-muted mb-1">
              Référence Commande
            </div>
            <div className="font-mono text-3xl sm:text-4xl font-bold text-white tracking-wider">
              {order.order_number}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-brand-gold/10">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-text-muted mb-1">
                Client
              </div>
              <div className="text-lg font-medium text-brand-text">
                {order.client_name}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-text-muted mb-1">
                Téléphone WhatsApp
              </div>
              <div className="text-lg font-mono text-brand-gold">
                {order.client_phone}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-brand-gold/10">
            <div className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-text-muted mb-2">
              Statut actuel
            </div>
            <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-sm sm:text-base font-semibold tracking-wide shadow-sm ${statusDisplay.classes}`}>
              {statusDisplay.icon}
              {statusDisplay.label}
            </div>
          </div>

          <div className="pt-6 border-t border-brand-gold/15">
            <div className="flex justify-between items-baseline">
              <span className="font-bebas text-lg sm:text-xl tracking-wider text-brand-text-muted uppercase">
                Total Commande
              </span>
              <span className="font-bebas text-3xl sm:text-4xl tracking-wider text-brand-gold">
                {order.total?.toLocaleString()} FCFA
              </span>
            </div>
          </div>

          {/* Premium subtle bottom accent line */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-brand-gold/70 to-transparent z-30" />
        </div>

        {/* WhatsApp Assistance Help Action */}
        <div className="mt-8 text-center space-y-4 animate-slide-up-fade">
          <p className="text-sm text-brand-text-muted">
            Pour toute modification ou question urgente, contactez Vioutou en direct sur WhatsApp.
          </p>
          <a
            href={`https://wa.me/22967280018?text=${encodeURIComponent(`Bonjour Vioutou, je souhaite avoir des informations sur ma commande ${order.order_number}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bebas text-xl uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_rgba(37,211,102,0.25)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <MessageCircle size={20} />
            Contacter le support WhatsApp
          </a>
        </div>
      </div>
    </PublicLayout>
  );
}
