// src/admin/screens/AnalyticsScreen.tsx
// ============================================
// Écran d'analytics et statistiques
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import { AdminCard, AdminButton, AdminSelect } from '../components';
import { TrendingUp, ShoppingCart, Users, DollarSign, Package } from 'lucide-react';
import { fetchAdminOrders } from '@/services/orderService';
import { fetchAdminProducts } from '@/services/productService';
import { getTotalCustomersCount } from '@/services/customerService';
import type { AdminOrder, OrderStatus, AdminProduct } from '@/admin/types';

interface AnalyticsScreenProps {
  onBack: () => void;
}

type TimeRange = '7d' | '30d' | '90d' | 'all';

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onBack }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersData, productsData, customers] = await Promise.all([
        fetchAdminOrders(),
        fetchAdminProducts(),
        getTotalCustomersCount()
      ]);

      // Filter by time range
      const now = new Date();
      const cutoffDate = new Date();
      
      if (timeRange === '7d') cutoffDate.setDate(now.getDate() - 7);
      else if (timeRange === '30d') cutoffDate.setDate(now.getDate() - 30);
      else if (timeRange === '90d') cutoffDate.setDate(now.getDate() - 90);
      else cutoffDate.setFullYear(2000); // all

      const filteredOrders = ordersData.filter(o => new Date(o.created_at) >= cutoffDate);

      setOrders(filteredOrders);
      setProducts(productsData);
      setTotalCustomers(customers);
    } catch (err: unknown) {
      console.error('Erreur chargement analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    const load = async () => {
      await loadData();
    };
    load();
  }, [loadData]);

  // Calculations
  const totalRevenue = orders
    .filter(o => o.status === 'LIVRÉE')
    .reduce((sum, o) => sum + (o.total || 0), 0);

  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const conversionRate = totalCustomers > 0 ? (totalOrders / totalCustomers) * 100 : 0;

  // Orders by status
  const ordersByStatus: Record<OrderStatus, number> = {
    'EN ATTENTE': orders.filter(o => o.status === 'EN ATTENTE').length,
    'CONFIRMÉE': orders.filter(o => o.status === 'CONFIRMÉE').length,
    'EN LIVRAISON': orders.filter(o => o.status === 'EN LIVRAISON').length,
    'LIVRÉE': orders.filter(o => o.status === 'LIVRÉE').length,
    'ANNULÉE': orders.filter(o => o.status === 'ANNULÉE').length
  };

  // Low stock products
  const lowStockProducts = products.filter(p => (p.stock || 0) <= 5);

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">
            Analytics
          </h1>
          <p className="text-brand-text-muted mt-1">
            Statistiques et performances
          </p>
        </div>
        <div className="flex gap-3">
          <AdminSelect
            value={timeRange}
            onChange={(v) => setTimeRange(v as TimeRange)}
            options={[
              { value: '7d', label: '7 derniers jours' },
              { value: '30d', label: '30 derniers jours' },
              { value: '90d', label: '90 derniers jours' },
              { value: 'all', label: 'Tout le temps' }
            ]}
            className="w-48"
          />
          <AdminButton variant="secondary" onClick={onBack}>
            Retour
          </AdminButton>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-text-muted uppercase tracking-wider mb-1">
                Revenu Total
              </p>
              <p className="text-3xl font-bebas text-brand-text">{formatCurrency(totalRevenue)}</p>
              <p className="text-sm text-brand-text-muted mt-2">
                Commandes livrées
              </p>
            </div>
            <div className="p-3 bg-brand-gold/10 rounded-lg text-brand-gold">
              <DollarSign size={24} />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-text-muted uppercase tracking-wider mb-1">
                Commandes
              </p>
              <p className="text-3xl font-bebas text-brand-text">{totalOrders}</p>
              <p className="text-sm text-brand-text-muted mt-2">
                Sur la période
              </p>
            </div>
            <div className="p-3 bg-brand-gold/10 rounded-lg text-brand-gold">
              <ShoppingCart size={24} />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-text-muted uppercase tracking-wider mb-1">
                Panier Moyen
              </p>
              <p className="text-3xl font-bebas text-brand-text">{formatCurrency(averageOrderValue)}</p>
              <p className="text-sm text-brand-text-muted mt-2">
                Par commande
              </p>
            </div>
            <div className="p-3 bg-brand-gold/10 rounded-lg text-brand-gold">
              <TrendingUp size={24} />
            </div>
          </div>
        </AdminCard>

        <AdminCard>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-text-muted uppercase tracking-wider mb-1">
                Clients
              </p>
              <p className="text-3xl font-bebas text-brand-text">{totalCustomers}</p>
              <p className="text-sm text-brand-text-muted mt-2">
                Clients uniques
              </p>
            </div>
            <div className="p-3 bg-brand-gold/10 rounded-lg text-brand-gold">
              <Users size={24} />
            </div>
          </div>
        </AdminCard>
      </div>

      {/* Orders by Status */}
      <AdminCard>
        <h2 className="font-bebas text-xl text-brand-text uppercase mb-6">
          Commandes par statut
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(ordersByStatus).map(([status, count]) => (
            <div key={status} className="text-center p-4 bg-brand-bg-alt rounded-lg">
              <p className="text-2xl font-bebas text-brand-text">{count}</p>
              <p className="text-xs text-brand-text-muted mt-1">{status}</p>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <AdminCard className="border-l-4 border-l-yellow-500">
          <h2 className="font-bebas text-xl text-brand-text uppercase mb-4">
            Alertes Stock
          </h2>
          <div className="space-y-2">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-brand-bg rounded-lg">
                <div className="flex items-center gap-3">
                  <Package size={18} className="text-yellow-500" />
                  <span className="text-brand-text">{product.name}</span>
                </div>
                <span className="text-sm font-bold text-yellow-600">
                  Stock: {product.stock || 0}
                </span>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* Conversion Rate */}
      <AdminCard>
        <h2 className="font-bebas text-xl text-brand-text uppercase mb-4">
          Taux de Conversion
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bebas text-brand-gold">
            {conversionRate.toFixed(1)}%
          </div>
          <p className="text-sm text-brand-text-muted">
            {totalOrders} commandes / {totalCustomers} clients
          </p>
        </div>
      </AdminCard>
    </div>
  );
};