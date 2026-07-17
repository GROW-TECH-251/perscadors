// src/app/admin/page.tsx
// ============================================
// Dashboard Admin Premium (Levier 4 : Web Share API & Partage Story Vrai)
// ============================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { fetchAdminProducts, deleteProduct } from '@/services/productService';
import { fetchAdminOrders } from '@/services/orderService';
import { fetchCustomerSummaries } from '@/services/customerService';
import { fetchShopSettings, formatWhatsAppMessage, getDefaultShopSettings } from '@/services/settingsService';
import { AdminCard, AdminButton } from '@/admin/components';
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, AlertTriangle, Eye, Edit, Trash2, MessageCircle, Share2, Award, X } from 'lucide-react';
import type { AdminProduct, AdminOrder, ShopSettings } from '@/admin/types';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<ShopSettings>(getDefaultShopSettings());
  const [storyToast, setStoryToast] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    lowStockProducts: 0
  });
  const [recentOrders, setRecentOrders] = useState<AdminOrder[]>([]);
  const [topProducts, setTopProducts] = useState<AdminProduct[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      const [products, orders, customers, shopSettings] = await Promise.all([
        fetchAdminProducts(),
        fetchAdminOrders(),
        fetchCustomerSummaries(),
        fetchShopSettings()
      ]);

      if (shopSettings) {
        setSettings(shopSettings);
      }

      const totalRevenue = orders
        .filter((order) => order.status === 'LIVRÉE')
        .reduce((sum, order) => sum + (order.total || 0), 0);

      const pendingOrders = orders.filter((order) => order.status === 'EN ATTENTE').length;
      const lowStockProducts = products.filter((product) => (product.stock || 0) <= 5).length;

      setStats({
        totalProducts: products.length,
        totalOrders: orders.length,
        totalCustomers: customers.length,
        totalRevenue,
        pendingOrders,
        lowStockProducts
      });

      setRecentOrders(orders.slice(0, 5));
      setTopProducts(
        [...products]
          .filter((product) => product.visible)
          .sort((firstProduct, secondProduct) => {
            const demandGap = (secondProduct.demand || 0) - (firstProduct.demand || 0);
            if (demandGap !== 0) {
              return demandGap;
            }

            return Number(Boolean(secondProduct.badge)) - Number(Boolean(firstProduct.badge));
          })
          .slice(0, 3)
      );
    } catch (error: unknown) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadDashboardData();
    };

    init();
  }, [loadDashboardData]);

  const handleDeleteProduct = async (productId: number) => {
    if (!window.confirm('Supprimer ce produit ?')) {
      return;
    }

    try {
      const result = await deleteProduct(productId);
      if (result.error) {
        alert(result.error);
        return;
      }

      await loadDashboardData();
    } catch (error: unknown) {
      console.error('Erreur suppression produit:', error);
      alert('Erreur lors de la suppression du produit.');
    }
  };

  const formatCurrency = (amount: number) => `${amount.toLocaleString('fr-FR')} FCFA`;

  // ============================================
  // LEVIER 4 : PARTAGE INSTANTANÉ WHATSAPP (Web Share API Natif)
  // ============================================
  const handleShareStory = async (product: AdminProduct) => {
    const message = formatWhatsAppMessage(settings.story_share_template, {
      shopName: settings.shop_name,
      productName: product.name,
      productPrice: formatCurrency(product.price)
    });

    // 1. Tentative de Partage Natif Mobile (Web Share API) vers l'onglet Statut WhatsApp avec l'image du produit !
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
                // Telecharger l'image du produit pour l'inclure dans le partage
        let shareData = {
          title: `Best-Seller ${settings.shop_name} : ${product.name}`,
          text: message,
          url: 'https://hpcollection.bj'
        };

        // Tenter d'ajouter l'image comme fichier joint (Web Share API Level 2)
        if (product.image_url && typeof navigator.canShare === 'function') {
          try {
            const response = await fetch(product.image_url);
            const blob = await response.blob();
            const fileName = product.name.replace(/[^a-z0-9]/gi, '_') + '.jpg';
            const file = new File([blob], fileName, { type: blob.type });
            const filesShare = { files: [file] };
            if (navigator.canShare(filesShare)) {
              shareData = { ...shareData, ...filesShare };
            }
          } catch {
            // Echec silencieux - partage sans image
          }
        }

        await navigator.share(shareData)
        setStoryToast(product.name);
        setTimeout(() => setStoryToast(null), 6000);
        return;
      } catch (err: unknown) {
        console.log('Partage natif annulé ou non supporté, bascule sur presse-papier...', err);
      }
    }

    // 2. Fallback pour Desktop ou si navigator.share échoue :
    try {
      await navigator.clipboard.writeText(message);
    } catch (error: unknown) {
      console.error('Erreur copie story:', error);
    }

    // Ouverture directe WhatsApp dans le fil d'exécution (esquive le bloqueur de popups)
    window.open('https://api.whatsapp.com/send?text=' + encodeURIComponent(message), '_blank');

    // Afficher la notification Toast visuelle non bloquante
    setStoryToast(product.name);
    setTimeout(() => setStoryToast(null), 7000);
  };

  const handleBroadcastVIP = (product: AdminProduct) => {
    const message = formatWhatsAppMessage(settings.vip_magic_template, {
      shopName: settings.shop_name,
      clientName: 'la famille',
      productName: product.name,
      productPrice: formatCurrency(product.price),
      couponCode: 'VIP-VIOUTOU10'
    });

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
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
    <div className="space-y-8 relative">
      {/* Toast de notification de partage Story */}
      {storyToast && (
        <div className="fixed top-6 right-6 bg-brand-gold text-[#0A0A0A] p-6 rounded-2xl shadow-[0_20px_50px_rgba(184,149,42,0.5)] z-50 max-w-sm animate-slide-up-fade border border-brand-gold-light flex items-start gap-4 backdrop-blur-md">
          <div className="p-2.5 bg-[#0A0A0A] text-brand-gold rounded-xl flex-shrink-0 shadow">
            <Share2 size={24} />
          </div>
          <div className="flex-1">
            <h4 className="font-bebas text-xl uppercase tracking-wider font-bold">Mission Story WhatsApp</h4>
            <p className="text-xs mt-1 leading-relaxed font-medium">
              Le script publicitaire pour <strong>{storyToast}</strong> a été copié dans ton presse-papier. Colle-le directement dans l&apos;onglet <strong>Statut</strong> de WhatsApp ! 🚀
            </p>
          </div>
          <button onClick={() => setStoryToast(null)} className="p-1 hover:bg-black/10 rounded-full text-[#0A0A0A] cursor-pointer" aria-label="Fermer la notification">
            <X size={18} />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold border border-brand-gold/20">
            Vue premium back-office • Booster de Rentabilité
          </span>
          <h1 className="font-bebas text-4xl tracking-wider text-brand-text uppercase mt-3">
            Dashboard
          </h1>
          <p className="text-brand-text-muted mt-1">
            Vue d&apos;ensemble et pilotage en temps réel de votre boutique HP Collection
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <AdminButton variant="secondary" onClick={() => router.push('/admin/produits')}>
            <Package size={18} />
            Produits
          </AdminButton>
          <AdminButton variant="secondary" onClick={() => router.push('/admin/commandes')}>
            <ShoppingCart size={18} />
            Commandes
          </AdminButton>
          <AdminButton variant="primary" onClick={() => router.push('/admin/produits/nouveau')}>
            <Package size={18} />
            Nouveau Produit
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminCard className="border-l-4 border-l-brand-gold">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-text-muted uppercase tracking-wider mb-1">
                Revenu Total
              </p>
              <p className="text-3xl font-bebas text-brand-text">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp size={12} />
                Commandes livrées
              </p>
            </div>
            <div className="p-3 bg-brand-gold/10 rounded-lg text-brand-gold">
              <DollarSign size={24} />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-text-muted uppercase tracking-wider mb-1">
                Commandes
              </p>
              <p className="text-3xl font-bebas text-brand-text">{stats.totalOrders}</p>
              {stats.pendingOrders > 0 && (
                <p className="text-xs text-yellow-600 mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {stats.pendingOrders} en attente
                </p>
              )}
            </div>
            <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
              <ShoppingCart size={24} />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="border-l-4 border-l-purple-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-text-muted uppercase tracking-wider mb-1">
                Clients
              </p>
              <p className="text-3xl font-bebas text-brand-text">{stats.totalCustomers}</p>
              <p className="text-xs text-brand-text-muted mt-2">
                Clients uniques
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
              <Users size={24} />
            </div>
          </div>
        </AdminCard>

        <AdminCard className="border-l-4 border-l-green-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-brand-text-muted uppercase tracking-wider mb-1">
                Produits
              </p>
              <p className="text-3xl font-bebas text-brand-text">{stats.totalProducts}</p>
              {stats.lowStockProducts > 0 && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {stats.lowStockProducts} stock faible
                </p>
              )}
            </div>
            <div className="p-3 bg-green-100 rounded-lg text-green-600">
              <Package size={24} />
            </div>
          </div>
        </AdminCard>
      </div>

      {stats.pendingOrders > 0 || stats.lowStockProducts > 0 ? (
        <AdminCard className="border-l-4 border-l-yellow-500 bg-yellow-50">
          <div className="flex items-start gap-4">
            <AlertTriangle size={24} className="text-yellow-600 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="font-bebas text-lg text-brand-text uppercase mb-2">
                Actions Requises
              </h3>
              <div className="space-y-2 text-sm text-brand-text-muted">
                {stats.pendingOrders > 0 && (
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full" />
                    <strong>{stats.pendingOrders} commande(s)</strong> en attente de validation
                    <AdminButton variant="secondary" size="sm" onClick={() => router.push('/admin/commandes')} className="ml-2">
                      Voir
                    </AdminButton>
                  </p>
                )}
                {stats.lowStockProducts > 0 && (
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    <strong>{stats.lowStockProducts} produit(s)</strong> en stock faible
                    <AdminButton variant="secondary" size="sm" onClick={() => router.push('/admin/stock')} className="ml-2">
                      Voir
                    </AdminButton>
                  </p>
                )}
              </div>
            </div>
          </div>
        </AdminCard>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdminCard>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-bebas text-xl tracking-wider text-brand-text uppercase">
              Commandes Récentes
            </h2>
            <AdminButton variant="secondary" size="sm" onClick={() => router.push('/admin/commandes')}>
              <Eye size={14} />
              Voir tout
            </AdminButton>
          </div>

          {recentOrders.length === 0 ? (
            <div className="text-center py-8 text-brand-text-muted">
              <ShoppingCart size={48} className="mx-auto mb-3 opacity-50" />
              <p>Aucune commande</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 bg-brand-bg-alt rounded-lg border border-brand-gold/10 hover:border-brand-gold/30 transition-colors cursor-pointer"
                  onClick={() => router.push('/admin/commandes')}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-gold/10 rounded-full flex items-center justify-center text-brand-gold font-bold text-sm">
                      {order.client_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-brand-text">{order.client_name}</p>
                      <p className="text-xs text-brand-text-muted">{order.order_number}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-brand-gold">{formatCurrency(order.total)}</p>
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                      order.status === 'LIVRÉE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : order.status === 'EN ATTENTE'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>

        {/* Levier 4 : Top 3 Best-Sellers en Temps Réel avec Boosters WhatsApp */}
        <AdminCard className="border-brand-gold/30 shadow-lg bg-gradient-to-b from-brand-bg-alt via-brand-bg to-brand-bg-alt">
          <div className="flex items-center justify-between mb-6 border-b border-brand-gold/15 pb-4">
            <div>
              <span className="text-xs font-bebas text-brand-gold uppercase tracking-widest flex items-center gap-1.5">
                <Award size={14} className="text-brand-gold" /> Pilote Best-Sellers
              </span>
              <h2 className="font-bebas text-2xl tracking-wider text-brand-text uppercase mt-1">
                Top 3 Produits Populaires
              </h2>
            </div>
            <AdminButton variant="secondary" size="sm" onClick={() => router.push('/admin/produits')}>
              <Edit size={14} />
              Catalogue
            </AdminButton>
          </div>

          {topProducts.length === 0 ? (
            <div className="text-center py-8 text-brand-text-muted">
              <Package size={48} className="mx-auto mb-3 opacity-50" />
              <p>Aucun produit populaire</p>
            </div>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div
                  key={`top-product-${product.id}-${index}`}
                  className="p-4 bg-brand-bg rounded-2xl border border-brand-gold/20 hover:border-brand-gold/50 transition-all shadow-md group/bestseller relative"
                >
                  <div className="absolute top-3 right-3 flex gap-1 z-10">
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/produits/${product.id}`)}
                      className="p-2 bg-brand-bg-alt border border-brand-gold/15 hover:border-brand-gold rounded-xl transition-colors cursor-pointer text-brand-text-muted hover:text-brand-gold"
                      aria-label="Modifier"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 bg-brand-bg-alt border border-brand-gold/15 hover:border-red-500 rounded-xl transition-colors cursor-pointer text-brand-text-muted hover:text-red-500"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mb-3 pr-16">
                    <div className="relative w-16 h-16 bg-brand-bg-alt rounded-xl overflow-hidden flex-shrink-0 border border-brand-gold/10">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.name}
                          fill
                          sizes="64px"
                          className="object-cover group-hover/bestseller:scale-105 transition-transform duration-300"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand-text-muted">
                          <Package size={24} />
                        </div>
                      )}
                      <div className="absolute top-1 left-1 w-5 h-5 bg-brand-gold text-[#0A0A0A] rounded-full flex items-center justify-center text-xs font-bold font-mono shadow">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <p className="font-bebas text-xl text-brand-text uppercase tracking-wide truncate max-w-full">{product.name}</p>
                      <p className="text-sm font-bold text-brand-gold">{formatCurrency(product.price)}</p>
                      <p className="text-xs text-brand-text-muted mt-0.5">Stock dispo: {product.stock ?? '∞'}</p>
                    </div>
                  </div>

                  {/* Levier 4 : Boutons Marketing WhatsApp Directs */}
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-brand-gold/10">
                    <button
                      type="button"
                      onClick={() => handleShareStory(product)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-brand-bg-alt border border-brand-gold/20 hover:border-brand-gold text-brand-text hover:text-brand-gold text-xs font-bebas uppercase tracking-wider rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm"
                    >
                      <Share2 size={13} /> Partager Story WA
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBroadcastVIP(product)}
                      className="flex items-center justify-center gap-1.5 py-2 px-3 bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bebas uppercase tracking-wider rounded-xl shadow-md active:scale-95 transition-all cursor-pointer font-bold"
                    >
                      <MessageCircle size={13} /> Diffuser aux VIP
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      </div>

      <AdminCard>
        <h2 className="font-bebas text-xl tracking-wider text-brand-text uppercase mb-6">
          Actions Rapides
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <AdminButton variant="primary" onClick={() => router.push('/admin/produits/nouveau')}>
            <Package size={18} />
            Ajouter Produit
          </AdminButton>
          <AdminButton variant="secondary" onClick={() => router.push('/admin/commandes')}>
            <ShoppingCart size={18} />
            Voir Commandes
          </AdminButton>
          <AdminButton variant="secondary" onClick={() => router.push('/admin/clients')}>
            <Users size={18} />
            Voir Clients
          </AdminButton>
          <AdminButton variant="secondary" onClick={() => router.push('/admin/stock')}>
            <AlertTriangle size={18} />
            Alertes Stock
          </AdminButton>
        </div>
      </AdminCard>
    </div>
  );
}
