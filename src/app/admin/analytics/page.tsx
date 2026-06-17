// src/app/admin/analytics/page.tsx
// ============================================
// Analytics Avancés avec Graphiques
// ============================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton } from '@/admin/components';
import { DollarSign, ShoppingCart, Users, Package } from 'lucide-react';
import { fetchAdminOrders } from '@/services/orderService';
import { fetchAdminProducts } from '@/services/productService';
import { fetchCustomerSummaries } from '@/services/customerService';
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

const COLORS = ['#B8952A', '#D4AE4E', '#F5F0E8', '#0A0A0A', '#888880'];

interface MonthData {
  month: string;
  revenue: number;
}

interface StatusData {
  name: string;
  value: number;
}

interface ProductData {
  name: string;
  price: number;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    averageOrderValue: 0
  });
  const [revenueByMonth, setRevenueByMonth] = useState<MonthData[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<StatusData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductData[]>([]);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const [orders, products, customers] = await Promise.all([
        fetchAdminOrders(),
        fetchAdminProducts(),
        fetchCustomerSummaries()
      ]);

      const totalRevenue = orders
        .filter((order) => order.status === 'LIVRÉE')
        .reduce((sum, order) => sum + order.total, 0);

      setStats({
        totalRevenue,
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalProducts: products.length,
        averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
      });

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const monthlyRevenue = orders
        .filter((order) => order.status === 'LIVRÉE' && new Date(order.created_at) >= sixMonthsAgo)
        .reduce((acc: MonthData[], order) => {
          const date = new Date(order.created_at);
          const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;

          const existingMonth = acc.find((month) => month.month === monthKey);
          if (existingMonth) {
            existingMonth.revenue += order.total;
          } else {
            acc.push({ month: monthKey, revenue: order.total });
          }

          return acc;
        }, [])
        .sort((firstMonth, secondMonth) => {
          const [firstMonthNumber, firstYear] = firstMonth.month.split('/');
          const [secondMonthNumber, secondYear] = secondMonth.month.split('/');
          return (
            new Date(Number(firstYear), Number(firstMonthNumber) - 1).getTime() -
            new Date(Number(secondYear), Number(secondMonthNumber) - 1).getTime()
          );
        });

      setRevenueByMonth(monthlyRevenue);

      const statusCounts: Record<string, number> = {};
      orders.forEach((order) => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      });

      setOrdersByStatus(
        Object.entries(statusCounts).map(([name, value]) => ({ name, value }))
      );

      setTopProducts(
        products
          .filter((product) => product.visible)
          .sort((firstProduct, secondProduct) => (secondProduct.demand || 0) - (firstProduct.demand || 0))
          .slice(0, 5)
          .map((product) => ({
            name: product.name.length > 20 ? `${product.name.substring(0, 20)}...` : product.name,
            price: product.price
          }))
      );
    } catch (error: unknown) {
      console.error('Erreur chargement analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadAnalytics();
    };
    init();
  }, [loadAnalytics]);

  const formatCurrency = (value: number) => `${value.toLocaleString('fr-FR')} FCFA`;
  const formatChartCurrency = (value: number | string | undefined) => formatCurrency(Number(value || 0));

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">Analytics</h1>
          <p className="text-brand-text-muted mt-1">Statistiques détaillées de votre boutique</p>
        </div>
        <AdminButton variant="secondary" onClick={() => router.push('/admin')}>
          Retour
        </AdminButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminCard className="border-l-4 border-l-brand-gold">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-text-muted uppercase tracking-wider mb-1">Revenu Total</p>
              <p className="text-3xl font-bebas text-brand-text">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-green-600 mt-2">Commandes livrées</p>
            </div>
            <div className="p-3 bg-brand-gold/10 rounded-lg text-brand-gold">
              <DollarSign size={24} />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-text-muted uppercase tracking-wider mb-1">Panier Moyen</p>
              <p className="text-3xl font-bebas text-brand-text">{formatCurrency(stats.averageOrderValue)}</p>
              <p className="text-xs text-brand-text-muted mt-2">Par commande</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
              <ShoppingCart size={24} />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="border-l-4 border-l-purple-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-text-muted uppercase tracking-wider mb-1">Clients</p>
              <p className="text-3xl font-bebas text-brand-text">{stats.totalCustomers}</p>
              <p className="text-xs text-brand-text-muted mt-2">Clients uniques</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
              <Users size={24} />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="border-l-4 border-l-green-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-text-muted uppercase tracking-wider mb-1">Produits</p>
              <p className="text-3xl font-bebas text-brand-text">{stats.totalProducts}</p>
              <p className="text-xs text-brand-text-muted mt-2">Produits actifs</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg text-green-600">
              <Package size={24} />
            </div>
          </div>
        </AdminCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard>
          <h2 className="font-bebas text-xl tracking-wider text-brand-text uppercase mb-6">
            Évolution des Revenus
          </h2>
          {revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE3" />
                <XAxis dataKey="month" stroke="#888880" />
                <YAxis stroke="#888880" tickFormatter={(value) => `${Number(value) / 1000}k`} />
                <Tooltip
                  formatter={(value) => formatChartCurrency(value as number | string | undefined)}
                  contentStyle={{ backgroundColor: '#F5F0E8', border: '1px solid #B8952A' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#B8952A"
                  strokeWidth={2}
                  dot={{ fill: '#B8952A' }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-brand-text-muted">
              Aucune donnée disponible
            </div>
          )}
        </AdminCard>

        <AdminCard>
          <h2 className="font-bebas text-xl tracking-wider text-brand-text uppercase mb-6">
            Commandes par Statut
          </h2>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props) => `${props.name || ''}: ${((Number(props.percent) || 0) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ordersByStatus.map((entry, index) => (
                    <Cell key={`${entry.name}-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${Number(value || 0)} commandes`}
                  contentStyle={{ backgroundColor: '#F5F0E8', border: '1px solid #B8952A' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-brand-text-muted">
              Aucune commande
            </div>
          )}
        </AdminCard>
      </div>

      <AdminCard>
        <h2 className="font-bebas text-xl tracking-wider text-brand-text uppercase mb-6">
          Top 5 Produits
        </h2>
        {topProducts.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EDEAE3" />
              <XAxis dataKey="name" stroke="#888880" tick={{ fontSize: 12 }} />
              <YAxis stroke="#888880" tickFormatter={(value) => `${Number(value) / 1000}k`} />
              <Tooltip
                formatter={(value) => formatChartCurrency(value as number | string | undefined)}
                contentStyle={{ backgroundColor: '#F5F0E8', border: '1px solid #B8952A' }}
              />
              <Bar dataKey="price" fill="#B8952A" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-brand-text-muted">
            Aucun produit disponible
          </div>
        )}
      </AdminCard>
    </div>
  );
}