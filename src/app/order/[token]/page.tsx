'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { requireSupabase } from '@/lib/supabase';

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
          setError('Commande introuvable.');
        } else {
          setOrder(data as TrackedOrder);
        }
      } catch (e) {
        setError('Erreur de chargement de la commande.');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [params?.token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-bg">
        <p>Chargement du suivi...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto p-8 text-center">
        <h1 className="text-3xl font-bold mb-4">Commande introuvable</h1>
        <p className="text-brand-text-muted">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-8">
      <h1 className="text-3xl font-bold tracking-wider mb-8">Suivi de commande</h1>

      <div className="bg-white rounded-3xl shadow p-8 space-y-6">
        <div>
          <div className="text-xs uppercase tracking-[2px] text-brand-text-muted">Référence</div>
          <div className="font-mono text-3xl mt-1">{order.order_number}</div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <div className="text-xs uppercase tracking-[2px] text-brand-text-muted">Client</div>
            <div className="mt-1">{order.client_name}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-[2px] text-brand-text-muted">Téléphone</div>
            <div className="mt-1">{order.client_phone}</div>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-[2px] text-brand-text-muted">Statut</div>
          <div className="mt-1 inline-block px-4 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
            {order.status || 'EN ATTENTE'}
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between items-baseline">
            <span className="text-brand-text-muted">Total</span>
            <span className="text-3xl font-semibold text-brand-gold">
              {order.total?.toLocaleString()} FCFA
            </span>
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-brand-text-muted">
        Pour toute question, contactez-nous directement sur WhatsApp.
      </p>
    </div>
  );
}