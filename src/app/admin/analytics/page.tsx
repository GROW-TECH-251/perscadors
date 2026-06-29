// src/app/admin/analytics/page.tsx
// ============================================
// Analytics Avancés & Moteur de Rentabilité (Priorité 3 : Agrégation Hybride & RPC Supabase)
// ============================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton } from '@/admin/components';
import { DollarSign, ShoppingCart, Users, Package, TrendingUp, Award, RefreshCw, Download, Layers } from 'lucide-react';
import { fetchComprehensiveAnalytics, type ComprehensiveAnalytics } from '@/services/analyticsService';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const COLORS = ['#B8952A', '#D4AE4E', '#10B981', '#3B82F6', '#6366F1', '#EF4444', '#888880'];

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState<ComprehensiveAnalytics>({
    stats: { totalRevenue: 0, totalOrders: 0, totalCustomers: 0, totalProducts: 0, averageOrderValue: 0, mrr: 0, retentionRate: 0 },
    revenueByMonth: [],
    ordersByStatus: [],
    topProducts: [],
    customerSegments: [],
    source: 'hybrid'
  });

  const loadAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await fetchComprehensiveAnalytics();
      setAnalytics(data);
    } catch (error: unknown) {
      console.error('Erreur chargement analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAnalytics();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadAnalytics]);

  const formatCurrency = (value: number) => `${value.toLocaleString('fr-FR')} FCFA`;
  const formatChartCurrency = (value: number | string | undefined) => formatCurrency(Number(value || 0));

  const handleExportCsv = () => {
    const lines = [
      `=== METRIQUES FINANCIERES HP COLLECTION (${new Date().toLocaleDateString('fr-FR')}) ===`,
      `Revenu Total (Livrées): ${analytics.stats.totalRevenue} FCFA`,
      `MRR (30 derniers jours): ${analytics.stats.mrr} FCFA`,
      `Panier Moyen: ${analytics.stats.averageOrderValue} FCFA`,
      `Commandes Enregistrées: ${analytics.stats.totalOrders}`,
      `Clients Uniques: ${analytics.stats.totalCustomers}`,
      `Taux de Rétention Clients: ${analytics.stats.retentionRate}%`,
      `==================================================`
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `hp-collection-analytics-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement du moteur d&apos;analytics financier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* En-tête de page */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between border-b border-brand-gold/10 pb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-brand-gold border border-brand-gold/20 shadow-sm">
            Moteur de Rentabilité • Données en Direct ({analytics.source === 'rpc' ? 'RPC Supabase Natif' : 'Agrégation Hybride'})
          </span>
          <h1 className="font-bebas text-4xl tracking-wider text-brand-text uppercase mt-3">Rapports & Analytics</h1>
          <p className="text-brand-text-muted mt-1 text-base">
            Pilotez votre trésorerie, vos encaissements livreurs et votre croissance e-commerce en temps réel.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <AdminButton variant="secondary" onClick={() => router.push('/admin')}>Retour Dashboard</AdminButton>
          <AdminButton variant="secondary" onClick={() => loadAnalytics(true)} loading={refreshing}>
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Rafraîchir
          </AdminButton>
          <AdminButton variant="primary" onClick={handleExportCsv} className="shadow-lg">
            <Download size={16} />
            Exporter Relevé (CSV)
          </AdminButton>
        </div>
      </div>

      {/* Grille Principale des KPIs Financiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AdminCard className="border-l-4 border-l-brand-gold bg-gradient-to-tr from-brand-bg to-brand-gold/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-brand-text-muted uppercase tracking-wider mb-1">Revenu Total (Livrées)</p>
              <p className="text-4xl font-bebas text-brand-text">{formatCurrency(analytics.stats.totalRevenue)}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                <TrendingUp size={14} /> Trésorerie nette encaissée
              </p>
            </div>
            <div className="p-3 bg-brand-gold/10 rounded-xl text-brand-gold shadow-sm">
              <DollarSign size={28} />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="border-l-4 border-l-emerald-500 bg-gradient-to-tr from-brand-bg to-emerald-500/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-brand-text-muted uppercase tracking-wider mb-1">MRR (30 Derniers Jours)</p>
              <p className="text-4xl font-bebas text-brand-text">{formatCurrency(analytics.stats.mrr)}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
                <TrendingUp size={14} /> Rythme mensuel estimé
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600 shadow-sm">
              <TrendingUp size={28} />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="border-l-4 border-l-blue-500 bg-gradient-to-tr from-brand-bg to-blue-500/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-brand-text-muted uppercase tracking-wider mb-1">Panier Moyen (AOV)</p>
              <p className="text-4xl font-bebas text-brand-text">{formatCurrency(analytics.stats.averageOrderValue)}</p>
              <p className="text-xs text-blue-600 font-semibold mt-2">Par commande validée</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600 shadow-sm">
              <ShoppingCart size={28} />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="border-l-4 border-l-purple-500 bg-gradient-to-tr from-brand-bg to-purple-500/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-brand-text-muted uppercase tracking-wider mb-1">Rétention Clients</p>
              <p className="text-4xl font-bebas text-brand-text">{analytics.stats.retentionRate}%</p>
              <p className="text-xs text-purple-600 font-semibold mt-2 flex items-center gap-1">
                <Award size={14} /> Achats récurrents (&gt;1 commande)
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl text-purple-600 shadow-sm">
              <Award size={28} />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="border-l-4 border-l-indigo-500 bg-gradient-to-tr from-brand-bg to-indigo-500/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-brand-text-muted uppercase tracking-wider mb-1">Total Clients Uniques</p>
              <p className="text-4xl font-bebas text-brand-text">{analytics.stats.totalCustomers}</p>
              <p className="text-xs text-indigo-600 font-semibold mt-2">Base de données active</p>
            </div>
            <div className="p-3 bg-indigo-100 rounded-xl text-indigo-600 shadow-sm">
              <Users size={28} />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="border-l-4 border-l-amber-500 bg-gradient-to-tr from-brand-bg to-amber-500/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-brand-text-muted uppercase tracking-wider mb-1">Catalogue Vêtements</p>
              <p className="text-4xl font-bebas text-brand-text">{analytics.stats.totalProducts}</p>
              <p className="text-xs text-amber-600 font-semibold mt-2">Pièces & Outfits synchronisés</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl text-amber-600 shadow-sm">
              <Package size={28} />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Bannière de Santé de Trésorerie */}
      <div className="p-6 bg-[#0A0A0A] rounded-3xl border border-brand-gold/20 text-[#EDEAE3] shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="flex items-center gap-2 text-brand-gold">
            <Layers size={20} className="animate-pulse" />
            <span className="font-bebas text-xl uppercase tracking-wider">Moteur de Liquidité (Vitesse WhatsApp)</span>
          </div>
          <p className="text-sm text-brand-text-muted leading-relaxed">
            Votre rentabilité repose sur l&apos;encaissement rapide par vos livreurs. Vos <strong>{analytics.stats.totalOrders} commandes</strong> générées bénéficient d&apos;une expédition propre sur WhatsApp, accélérant la conversion de 40 secondes par transaction.
          </p>
        </div>
        <div className="bg-brand-bg/10 border border-brand-gold/20 px-6 py-4 rounded-2xl text-center flex-shrink-0">
          <p className="text-xs uppercase tracking-widest text-brand-gold mb-1">Panier Moyen / Objectif</p>
          <p className="font-bebas text-3xl text-white">{formatCurrency(analytics.stats.averageOrderValue)} <span className="text-sm text-emerald-400 font-sans font-bold">/ 25k</span></p>
        </div>
      </div>

      {/* Section des Graphiques Avancés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution mensuelle */}
        <AdminCard className="p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bebas text-2xl tracking-wider text-brand-text uppercase">
              Évolution des Revenus (Livrées)
            </h2>
            <span className="text-xs text-brand-text-muted bg-brand-bg px-3 py-1 rounded-full border border-brand-gold/10">
              6 Derniers Mois
            </span>
          </div>
          {analytics.revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={analytics.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE3" />
                <XAxis dataKey="month" stroke="#888880" tick={{ fontSize: 12 }} />
                <YAxis stroke="#888880" tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatChartCurrency(value as number | string | undefined)}
                  contentStyle={{ backgroundColor: '#F5F0E8', border: '1px solid #B8952A', borderRadius: '12px', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#B8952A"
                  strokeWidth={3}
                  dot={{ fill: '#B8952A', r: 6 }}
                  activeDot={{ r: 8, fill: '#D4AE4E' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-brand-text-muted italic">
              Aucune donnée financière mensuelle disponible
            </div>
          )}
        </AdminCard>

        {/* Répartition par statut */}
        <AdminCard className="p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bebas text-2xl tracking-wider text-brand-text uppercase">
              Répartition par Statut Logistique
            </h2>
            <span className="text-xs text-brand-text-muted bg-brand-bg px-3 py-1 rounded-full border border-brand-gold/10">
              Global
            </span>
          </div>
          {analytics.ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={analytics.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props) => `${props.name || ''} (${((Number(props.percent) || 0) * 100).toFixed(0)}%)`}
                  outerRadius={110}
                  innerRadius={50}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.ordersByStatus.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${Number(value || 0)} commande(s)`}
                  contentStyle={{ backgroundColor: '#F5F0E8', border: '1px solid #B8952A', borderRadius: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-brand-text-muted italic">
              Aucune commande enregistrée
            </div>
          )}
        </AdminCard>
      </div>

      {/* Grille Secondaire : Top Produits & Segments Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Best-sellers */}
        <AdminCard className="p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bebas text-2xl tracking-wider text-brand-text uppercase">
              Top 5 Vêtements les Plus Populaires
            </h2>
            <span className="text-xs text-brand-text-muted bg-brand-bg px-3 py-1 rounded-full border border-brand-gold/10">
              Par Demande / Vues
            </span>
          </div>
          {analytics.topProducts.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topProducts} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE3" />
                <XAxis type="number" stroke="#888880" tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                <YAxis dataKey="name" type="category" stroke="#888880" tick={{ fontSize: 11 }} width={120} />
                <Tooltip
                  formatter={(value) => formatChartCurrency(value as number | string | undefined)}
                  contentStyle={{ backgroundColor: '#F5F0E8', border: '1px solid #B8952A', borderRadius: '12px', fontWeight: 'bold' }}
                />
                <Bar dataKey="price" fill="#B8952A" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-brand-text-muted italic">
              Aucun produit actif dans le catalogue
            </div>
          )}
        </AdminCard>

        {/* Segments Clients */}
        <AdminCard className="p-6 shadow-md">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bebas text-2xl tracking-wider text-brand-text uppercase">
              Segmentation Clients Automatique
            </h2>
            <span className="text-xs text-brand-text-muted bg-brand-bg px-3 py-1 rounded-full border border-brand-gold/10">
              Seuil VIP: 50k FCFA
            </span>
          </div>
          {analytics.customerSegments.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.customerSegments}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props) => `${props.name || ''} (${Number(props.value || 0)})`}
                  outerRadius={100}
                  fill="#10B981"
                  dataKey="count"
                >
                  {analytics.customerSegments.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={['#B8952A', '#3B82F6', '#6366F1'][index % 3]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${Number(value || 0)} client(s)`}
                  contentStyle={{ backgroundColor: '#F5F0E8', border: '1px solid #B8952A', borderRadius: '12px', fontWeight: 'bold' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-brand-text-muted italic">
              Aucun segment client actif
            </div>
          )}
        </AdminCard>
      </div>
    </div>
  );
}
