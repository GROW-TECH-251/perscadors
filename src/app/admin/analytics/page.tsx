// src/app/admin/analytics/page.tsx
// ============================================
// Analytics Avancés & Moteur de Rentabilité (Priorité 3 : Agrégation Hybride & RPC Supabase)
// ============================================

'use client';

import { useOrdersRealtime } from '@/hooks/useOrdersRealtime';
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

// ============================================
// IMP-10 — Polish du dashboard : KPI animés, tooltips premium, états vides
// soignés. Aucun nouveau graphique, export CSV inchangé.
// ============================================
const KPI_COUNTUP_MS = 800;

// Comptage animé (requestAnimationFrame, easeOutCubic) coupé sous
// prefers-reduced-motion : la valeur finale s'affiche immédiatement.
function useCountUp(target: number): number {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    // Reduced-motion : progress saute directement à 1 (aucune animation),
    // le setState reste dans le callback rAF (pas de rendu en cascade).
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    let rafId = 0;

    const step = (now: number) => {
      const progress = reduce ? 1 : Math.min((now - start) / KPI_COUNTUP_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target]);

  return display;
}

function KpiValue({ value, format, className = 'text-4xl font-bebas text-brand-text' }: { value: number; format: (value: number) => string; className?: string }) {
  const animated = useCountUp(value);
  return <p className={className}>{format(animated)}</p>;
}

// Tooltip partagé : panneau sombre/or cohérent avec l'identité admin,
// label doré, valeur formatée par graphique (FCFA, %, clients...).
function ChartTooltip({ active, payload, label, valueFormatter }: {
  active?: boolean;
  payload?: Array<{ value?: string | number; name?: string }>;
  label?: string | number;
  valueFormatter?: (value: number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const heading = label !== undefined && label !== '' ? String(label) : payload[0]?.name;

  return (
    <div className="bg-[#0A0A0A]/95 border border-brand-gold/40 rounded-xl px-4 py-3 shadow-xl max-w-[240px]">
      {heading && <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-gold mb-1">{heading}</p>}
      <p className="font-bebas text-xl text-brand-text leading-none">
        {valueFormatter ? valueFormatter(Number(payload[0].value || 0)) : String(payload[0].value ?? '')}
      </p>
    </div>
  );
}

// État vide structuré : là où l'italique nu rendait la zone « cassée »,
// chaque graphique explique maintenant ce qui remplira la donnée.
function ChartEmptyState({ icon: Icon, title, hint }: { icon: React.ComponentType<{ size?: number }>; title: string; hint: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 rounded-2xl border border-dashed border-brand-gold/25 bg-brand-bg/50 px-6 text-center">
      <div className="p-3 bg-brand-gold/10 rounded-full text-brand-gold">
        <Icon size={22} />
      </div>
      <p className="font-bebas text-xl tracking-wider text-brand-text uppercase">{title}</p>
      <p className="text-xs text-brand-text-muted max-w-[240px] leading-relaxed">{hint}</p>
    </div>
  );
}

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
    actionItems: [],
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

  useOrdersRealtime(() => { loadAnalytics(); });

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
            Vue de rentabilité • Données actualisées
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
              <KpiValue value={analytics.stats.totalRevenue} format={formatCurrency} />
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
              <KpiValue value={analytics.stats.mrr} format={formatCurrency} />
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
              <KpiValue value={analytics.stats.averageOrderValue} format={formatCurrency} />
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
              <KpiValue value={analytics.stats.retentionRate} format={(value) => `${value}%`} />
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
              <KpiValue value={analytics.stats.totalCustomers} format={(value) => value.toLocaleString('fr-FR')} />
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
              <KpiValue value={analytics.stats.totalProducts} format={(value) => value.toLocaleString('fr-FR')} />
              <p className="text-xs text-amber-600 font-semibold mt-2">Pièces et looks disponibles</p>
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
                  cursor={{ stroke: '#B8952A', strokeOpacity: 0.35 }}
                  content={<ChartTooltip valueFormatter={formatChartCurrency} />}
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
            <ChartEmptyState
              icon={TrendingUp}
              title="Aucun revenu enregistré"
              hint="Les revenus apparaîtront dès votre première commande livrée."
            />
          )}
        </AdminCard>

        <section className="rounded-3xl border border-brand-gold/25 bg-gradient-to-br from-[#12110d] via-brand-bg-alt to-brand-bg p-6 shadow-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-5"><div><span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">Décisions du jour</span><h2 className="font-bebas text-2xl tracking-wider text-brand-text uppercase mt-1">À traiter maintenant</h2></div><p className="text-sm text-brand-text-muted">Passez des données à l’action.</p></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[{ id: 'confirm', label: 'À confirmer', hint: 'Valider les ventes', path: '/admin/commandes' }, { id: 'ship', label: 'À expédier', hint: 'Préparer les livraisons', path: '/admin/commandes' }, { id: 'stock', label: 'Stock à risque', hint: 'Réapprovisionner', path: '/admin/stock' }, { id: 'followup', label: 'Clients à relancer', hint: 'Créer une opportunité', path: '/admin/clients' }, { id: 'sync', label: 'À enregistrer', hint: 'Finaliser les commandes en attente', path: '/admin/commandes' }].map((item) => { const count = analytics.actionItems.find((action) => action.id === item.id)?.count || 0; return <button key={item.id} type="button" onClick={() => router.push(item.path)} className="text-left rounded-2xl border border-brand-gold/15 bg-brand-bg/70 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-gold/60"><span className="text-[11px] font-semibold uppercase tracking-wider text-brand-gold">{item.label}</span><p className="font-bebas text-3xl text-brand-text mt-3">{count}</p><p className="text-xs text-brand-text-muted mt-1">{item.hint}</p></button>; })}
          </div>
        </section>
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
                  cursor={{ fill: 'rgba(184, 149, 42, 0.08)' }}
                  content={<ChartTooltip valueFormatter={formatChartCurrency} />}
                />
                <Bar dataKey="price" fill="#B8952A" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState
              icon={Package}
              title="Catalogue vide"
              hint="Ajoutez des produits visibles pour voir apparaître les best-sellers."
            />
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
                <Tooltip content={<ChartTooltip valueFormatter={(value) => `${value} client(s)`} />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <ChartEmptyState
              icon={Users}
              title="Aucun client segmenté"
              hint="Les segments se construiront dès vos premières commandes."
            />
          )}
        </AdminCard>
      </div>
    </div>
  );
}
