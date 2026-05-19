// src/admin/screens/DashboardHome.tsx
// ============================================
// Écran d'accueil du dashboard admin
// ============================================

import React, { useEffect, useState, useCallback } from 'react';
import { StatCard, AdminCard, AdminButton, AdminEmptyState } from '../components';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { fetchAdminProducts } from '@/services/productService';
import { fetchAdminOrders } from '@/services/orderService';
import { getTotalCustomersCount } from '@/services/customerService';
import type { AdminOrder, AdminProduct } from '@/admin/types';

interface DashboardHomeProps {
  onNavigate: (screen: string) => void;
  onEditProduct: (product: AdminProduct) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ onNavigate, onEditProduct }) => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    totalProducts: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Déclarer la fonction AVANT useEffect avec useCallback
  const loadDashboardData = useCallback(async () => {
    setLoading(true);

    try {
      const [products, orders, customers] = await Promise.all([
        fetchAdminProducts(),
        fetchAdminOrders(),
        getTotalCustomersCount()
      ]);

      const totalRevenue = orders
        .filter(o => o.status === 'LIVRÉE')
        .reduce((sum, o) => sum + (o.total || 0), 0);

      const pendingOrders = orders.filter(o => o.status === 'EN ATTENTE').length;
      const lowStockProducts = products.filter(p => (p.stock || 0) <= 5).length;

      setStats({
        totalOrders: orders.length,
        totalRevenue,
        totalProducts: products.length,
        totalCustomers: customers,
        pendingOrders,
        lowStockProducts
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (err: unknown) {
      console.error('Erreur chargement dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Maintenant useEffect peut appeler loadDashboardData
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} FCFA`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">
          Dashboard
        </h1>
        <p className="text-brand-text-muted mt-1">
          Vue d'ensemble de votre boutique
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Commandes"
          value={stats.totalOrders}
          icon={<ShoppingCart size={24} />}
          trend="up"
          trendValue={`${stats.pendingOrders} en attente`}
        />

        <StatCard
          title="Revenu Total"
          value={formatCurrency(stats.totalRevenue)}
          icon={<DollarSign size={24} />}
          trend="up"
          trendValue="Commandes livrées"
        />

        <StatCard
          title="Produits"
          value={stats.totalProducts}
          icon={<Package size={24} />}
          trend={stats.lowStockProducts > 0 ? 'down' : 'neutral'}
          trendValue={stats.lowStockProducts > 0 ? `${stats.lowStockProducts} stock faible` : 'Stock OK'}
        />

        <StatCard
          title="Clients"
          value={stats.totalCustomers}
          icon={<Users size={24} />}
          trend="up"
          trendValue="Clients uniques"
        />
      </div>

      {/* Alerts */}
      {stats.pendingOrders > 0 || stats.lowStockProducts > 0 ? (
        <AdminCard className="border-l-4 border-l-yellow-500">
          <div className="flex items-start gap-4">
            <AlertTriangle size={24} className="text-yellow-500 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bebas text-lg text-brand-text uppercase mb-2">
                Actions requises
              </h3>
              <div className="space-y-2 text-sm text-brand-text-muted">
                {stats.pendingOrders > 0 && (
                  <p>
                    ⚠️ <strong>{stats.pendingOrders} commande(s)</strong> en attente de validation
                  </p>
                )}
                {stats.lowStockProducts > 0 && (
                  <p>
                    ⚠️ <strong>{stats.lowStockProducts} produit(s)</strong> en stock faible
                  </p>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                {stats.pendingOrders > 0 && (
                  <AdminButton
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigate('orders')}
                  >
                    Voir les commandes
                  </AdminButton>
                )}
                {stats.lowStockProducts > 0 && (
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    onClick={() => onNavigate('stockAlerts')}
                  >
                    Voir les alertes
                  </AdminButton>
                )}
              </div>
            </div>
          </div>
        </AdminCard>
      ) : null}

      {/* Recent Orders */}
      <AdminCard>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bebas text-xl tracking-wider text-brand-text uppercase">
            Commandes récentes
          </h2>
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => onNavigate('orders')}
          >
            Voir tout
          </AdminButton>
        </div>

        {recentOrders.length === 0 ? (
          <AdminEmptyState
            icon={<ShoppingCart size={48} />}
            title="Aucune commande"
            description="Les commandes apparaîtront ici"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brand-gold/20">
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">
                    Référence
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">
                    Client
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">
                    Total
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">
                    Statut
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-bebas uppercase tracking-wider text-brand-text-muted">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-brand-gold/10 hover:bg-brand-gold/5 cursor-pointer"
                    onClick={() => onNavigate('orderDetail')}
                  >
                    <td className="py-3 px-4 text-sm font-mono text-brand-text">
                      {order.order_number}
                    </td>
                    <td className="py-3 px-4 text-sm text-brand-text">
                      {order.client_name}
                    </td>
                    <td className="py-3 px-4 text-sm font-bold text-brand-gold">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          order.status === 'EN ATTENTE'
                            ? 'bg-yellow-100 text-yellow-700'
                            : order.status === 'CONFIRMÉE'
                            ? 'bg-blue-100 text-blue-700'
                            : order.status === 'LIVRÉE'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-brand-text-muted">
                      {new Date(order.created_at).toLocaleDateString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminCard
          className="text-center cursor-pointer hover:bg-brand-gold/5 transition-colors"
          onClick={() => onNavigate('products')}
        >
          <Package size={32} className="mx-auto mb-3 text-brand-gold" />
          <h3 className="font-bebas text-lg text-brand-text uppercase">Gérer les produits</h3>
          <p className="text-sm text-brand-text-muted mt-1">
            {stats.totalProducts} produits
          </p>
        </AdminCard>

        <AdminCard
          className="text-center cursor-pointer hover:bg-brand-gold/5 transition-colors"
          onClick={() => onNavigate('customers')}
        >
          <Users size={32} className="mx-auto mb-3 text-brand-gold" />
          <h3 className="font-bebas text-lg text-brand-text uppercase">Voir les clients</h3>
          <p className="text-sm text-brand-text-muted mt-1">
            {stats.totalCustomers} clients
          </p>
        </AdminCard>

        <AdminCard
          className="text-center cursor-pointer hover:bg-brand-gold/5 transition-colors"
          onClick={() => onNavigate('analytics')}
        >
          <TrendingUp size={32} className="mx-auto mb-3 text-brand-gold" />
          <h3 className="font-bebas text-lg text-brand-text uppercase">Analytics</h3>
          <p className="text-sm text-brand-text-muted mt-1">
            Statistiques détaillées
          </p>
        </AdminCard>
      </div>
    </div>
  );
};