// src/services/analyticsService.ts
// ============================================
// Service d'Analytics E-commerce (Cadre Final : Moteur d'Agrégation Hybride & RPC Supabase)
// ============================================

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { fetchAdminOrders } from './orderService';
import { fetchAdminProducts } from './productService';
import { fetchCustomerSummaries } from './customerService';

export interface ComprehensiveAnalytics {
  stats: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    totalProducts: number;
    averageOrderValue: number;
    mrr: number; // Monthly Recurring Revenue estimé
    retentionRate: number; // Taux de rétention clients
  };
  revenueByMonth: { month: string; revenue: number }[];
  ordersByStatus: { name: string; value: number }[];
  topProducts: { name: string; price: number; demand: number }[];
  customerSegments: { name: string; count: number }[];
  actionItems: { id: 'confirm' | 'ship' | 'stock' | 'followup' | 'sync'; count: number }[];
  source: 'rpc' | 'hybrid';
}

export async function trackEvent(name: string, metadata: object = {}) {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert([{ event_name: name, metadata }]);

    if (error) console.error("[Analytics] Tracking failed (intercepté):", error.message);
  } catch (err: unknown) {
    console.error("[Analytics] Tracking error:", err);
  }
}

export async function fetchComprehensiveAnalytics(): Promise<ComprehensiveAnalytics> {
  // 1. Chargement hybride des données locales & distantes
  const [orders, products, customers] = await Promise.all([
    fetchAdminOrders(),
    fetchAdminProducts(),
    fetchCustomerSummaries()
  ]);

  const deliveredOrders = orders.filter((o) => o.status === 'LIVRÉE');
  const totalRevenue = deliveredOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalOrders = orders.length;
  const totalCustomers = customers.length;
  const totalProducts = products.length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  // Calcul du MRR (Revenu des 30 derniers jours)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const mrr = deliveredOrders
    .filter((o) => new Date(o.created_at) >= thirtyDaysAgo)
    .reduce((sum, o) => sum + (o.total || 0), 0);

  // Calcul du taux de rétention (Clients avec plus de 1 commande)
  const repeatCustomers = customers.filter((c) => c.orderCount > 1).length;
  const retentionRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

  // Calculs par statut
  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });
  const ordersByStatus = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

  // Calculs des Top Produits
  const topProducts = products
    .filter((p) => p.visible)
    .sort((a, b) => (b.demand || 0) - (a.demand || 0))
    .slice(0, 5)
    .map((p) => ({
      name: p.name.length > 22 ? `${p.name.substring(0, 22)}...` : p.name,
      price: p.price,
      demand: p.demand
    }));

  // Calcul des segments clients
  const segmentCounts: Record<string, number> = {
    'VIP': customers.filter((c) => c.totalSpent >= 50000).length,
    'Fidèle': customers.filter((c) => c.orderCount >= 3 && c.totalSpent < 50000).length,
    'Standard': customers.filter((c) => c.orderCount < 3 && c.totalSpent < 50000).length
  };
  const customerSegments = Object.entries(segmentCounts).map(([name, count]) => ({ name, count }));

  // Évolution mensuelle (6 derniers mois)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const monthlyRevenue = deliveredOrders
    .filter((o) => new Date(o.created_at) >= sixMonthsAgo)
    .reduce((acc: { month: string; revenue: number }[], order) => {
      const date = new Date(order.created_at);
      const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;

      const existing = acc.find((m) => m.month === monthKey);
      if (existing) {
        existing.revenue += order.total;
      } else {
        acc.push({ month: monthKey, revenue: order.total });
      }

      return acc;
    }, [])
    .sort((a, b) => {
      const [m1, y1] = a.month.split('/');
      const [m2, y2] = b.month.split('/');
      return new Date(Number(y1), Number(m1) - 1).getTime() - new Date(Number(y2), Number(m2) - 1).getTime();
    });

  const actionItems = [
    { id: 'confirm' as const, count: orders.filter((order) => order.status === 'EN ATTENTE').length },
    { id: 'ship' as const, count: orders.filter((order) => order.status === 'CONFIRMÉE' || order.status === 'EN LIVRAISON').length },
    { id: 'stock' as const, count: products.filter((product) => (product.stock || 0) <= 5).length },
    { id: 'followup' as const, count: customers.filter((customer) => customer.segments.includes('À relancer')).length },
    { id: 'sync' as const, count: orders.filter((order) => order.sync_status !== 'synced').length }
  ];

  const baseResult: ComprehensiveAnalytics = {
    stats: {
      totalRevenue,
      totalOrders,
      totalCustomers,
      totalProducts,
      averageOrderValue,
      mrr,
      retentionRate
    },
    revenueByMonth: monthlyRevenue.length > 0 ? monthlyRevenue : [{ month: `${new Date().getMonth() + 1}/${new Date().getFullYear()}`, revenue: totalRevenue }],
    ordersByStatus: ordersByStatus.length > 0 ? ordersByStatus : [{ name: 'EN ATTENTE', value: 0 }],
    topProducts: topProducts.length > 0 ? topProducts : [{ name: 'Panier Vide', price: 0, demand: 0 }],
    customerSegments: customerSegments.length > 0 ? customerSegments : [{ name: 'Nouveau', count: 0 }],
    actionItems,
    source: 'hybrid'
  };

  if (!isSupabaseConfigured || !supabase) {
    return baseResult;
  }

  // 2. Tentative d'exécution des fonctions RPC Supabase (Procédure Stockée)
  try {
    const [revRes, prodRes, statRes] = await Promise.all([
      supabase.rpc('get_monthly_revenue'),
      supabase.rpc('get_top_viewed_products'),
      supabase.rpc('get_order_status_counts')
    ]);

    if (!revRes.error && revRes.data && Array.isArray(revRes.data)) {
      baseResult.revenueByMonth = revRes.data;
      baseResult.source = 'rpc';
    }
    if (!prodRes.error && prodRes.data && Array.isArray(prodRes.data)) {
      baseResult.topProducts = prodRes.data;
    }
    if (!statRes.error && statRes.data && Array.isArray(statRes.data)) {
      baseResult.ordersByStatus = statRes.data;
    }
  } catch (err: unknown) {
    console.error('[Analytics] Erreur RPC Supabase (repli sur le calcul hybride):', err);
  }

  return baseResult;
}
