// src/app/admin/stock/page.tsx
// ============================================
// Alertes stock opérationnelles
// ============================================

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton, AdminEmptyState, AdminSearch, AdminBadge } from '@/admin/components';
import { Package, RefreshCw, Plus } from 'lucide-react';
import { fetchAdminProducts, updateProduct } from '@/services/productService';
import type { AdminProduct } from '@/admin/types';

export default function AdminStockPage() {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'critical' | 'out' | 'healthy'>('all');
  const [restockingId, setRestockingId] = useState<number | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminProducts();
      setProducts(data);
    } catch (error: unknown) {
      console.error('Erreur chargement stock:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadProducts();
    };
    init();
  }, [loadProducts]);

  const outOfStockProducts = useMemo(() => products.filter((product) => product.stock <= 0), [products]);
  const criticalStockProducts = useMemo(() => products.filter((product) => product.stock > 0 && product.stock <= 5), [products]);
  const healthyStockProducts = useMemo(() => products.filter((product) => product.stock > 5), [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        filter === 'all' ||
        (filter === 'critical' && product.stock > 0 && product.stock <= 5) ||
        (filter === 'out' && product.stock <= 0) ||
        (filter === 'healthy' && product.stock > 5);

      return matchesSearch && matchesFilter;
    });
  }, [filter, products, searchQuery]);

  const handleTemporaryHide = async (product: AdminProduct) => {
    setRestockingId(product.id);
    try {
      await updateProduct(product.id, { visible: false });
      await loadProducts();
    } catch (error) {
      console.error('Erreur masquage produit:', error);
    } finally {
      setRestockingId(null);
    }
  };

  const handleQuickRestock = async (product: AdminProduct, quantity: number) => {
    setRestockingId(product.id);
    try {
      const result = await updateProduct(product.id, {
        stock: product.stock + quantity
      });

      if (result.error) {
        alert(result.error);
        return;
      }

      await loadProducts();
    } catch (error: unknown) {
      console.error('Erreur restockage:', error);
      alert('Erreur lors du réassort');
    } finally {
      setRestockingId(null);
    }
  };

  const getBadgeVariant = (product: AdminProduct): 'success' | 'warning' | 'danger' => {
    if (product.stock <= 0) {
      return 'danger';
    }
    if (product.stock <= 5) {
      return 'warning';
    }
    return 'success';
  };

  const getBadgeLabel = (product: AdminProduct): string => {
    if (product.stock <= 0) {
      return 'Rupture';
    }
    if (product.stock <= 5) {
      return 'Stock faible';
    }
    return 'Stock OK';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement des alertes stock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">Alertes Stock</h1>
          <p className="text-brand-text-muted mt-1">Pilotage du réassort et des ruptures</p>
        </div>
        <div className="flex gap-3">
          <AdminButton variant="secondary" onClick={() => router.push('/admin')}>Retour</AdminButton>
          <AdminButton variant="secondary" onClick={() => loadProducts()}>
            <RefreshCw size={16} />
            Rafraîchir
          </AdminButton>
        </div>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button type="button" onClick={() => setFilter('out')} className="text-left rounded-2xl border border-red-500/25 bg-red-500/5 p-5 transition-all hover:-translate-y-0.5 hover:border-red-500/60"><p className="text-xs font-semibold uppercase tracking-wider text-red-600">Ventes bloquées</p><p className="font-bebas text-3xl text-brand-text mt-2">{outOfStockProducts.length}</p><p className="text-sm text-brand-text-muted mt-1">Produits à réapprovisionner ou masquer</p></button>
        <button type="button" onClick={() => setFilter('critical')} className="text-left rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5 transition-all hover:-translate-y-0.5 hover:border-amber-500/60"><p className="text-xs font-semibold uppercase tracking-wider text-amber-600">Risque de rupture</p><p className="font-bebas text-3xl text-brand-text mt-2">{criticalStockProducts.length}</p><p className="text-sm text-brand-text-muted mt-1">Agir avant la prochaine vente</p></button>
        <button type="button" onClick={() => setFilter('healthy')} className="text-left rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-500/60"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Catalogue disponible</p><p className="font-bebas text-3xl text-brand-text mt-2">{healthyStockProducts.length}</p><p className="text-sm text-brand-text-muted mt-1">Produits prêts à vendre</p></button>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminCard className="border-l-4 border-l-red-500">
          <p className="text-sm uppercase tracking-wider text-brand-text-muted mb-2">Ruptures</p>
          <p className="font-bebas text-4xl text-brand-text">{outOfStockProducts.length}</p>
        </AdminCard>
        <AdminCard className="border-l-4 border-l-yellow-500">
          <p className="text-sm uppercase tracking-wider text-brand-text-muted mb-2">Stock critique</p>
          <p className="font-bebas text-4xl text-brand-text">{criticalStockProducts.length}</p>
        </AdminCard>
        <AdminCard className="border-l-4 border-l-green-500">
          <p className="text-sm uppercase tracking-wider text-brand-text-muted mb-2">Stock sain</p>
          <p className="font-bebas text-4xl text-brand-text">{healthyStockProducts.length}</p>
        </AdminCard>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <AdminSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher un produit ou une catégorie..."
          className="flex-1"
        />
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'critical', label: 'Critique' },
            { id: 'out', label: 'Rupture' },
            { id: 'healthy', label: 'OK' }
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilter(option.id as typeof filter)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                filter === option.id
                  ? 'bg-brand-gold text-[#0A0A0A]'
                  : 'bg-brand-bg-alt text-brand-text hover:bg-brand-gold/10'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <AdminEmptyState
          icon={<Package size={48} />}
          title="Aucun produit trouvé"
          description="Ajuste tes filtres ou ajoute un nouveau produit."
          action={
            <AdminButton variant="primary" onClick={() => router.push('/admin/produits/nouveau')}>
              <Plus size={18} />
              Nouveau produit
            </AdminButton>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => (
            <AdminCard key={`product-${product.id}-${index}`} className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bebas text-lg tracking-wider text-brand-text uppercase">{product.name}</h3>
                  <p className="text-xs text-brand-text-muted mt-1">{product.category}</p>
                </div>
                <AdminBadge variant={getBadgeVariant(product)}>{getBadgeLabel(product)}</AdminBadge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-brand-bg-alt p-3 border border-brand-gold/10">
                  <p className="text-xs uppercase tracking-wider text-brand-text-muted">Stock</p>
                  <p className="font-bebas text-3xl text-brand-text">{product.stock}</p>
                </div>
                <div className="rounded-lg bg-brand-bg-alt p-3 border border-brand-gold/10">
                  <p className="text-xs uppercase tracking-wider text-brand-text-muted">Demande</p>
                  <p className="font-bebas text-3xl text-brand-text">{product.demand}</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <AdminButton
                  variant="secondary"
                  size="sm"
                  onClick={() => router.push(`/admin/produits/${product.id}`)}
                >
                  Modifier
                </AdminButton>
                <AdminButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleQuickRestock(product, 5)}
                  loading={restockingId === product.id}
                >
                  +5
                </AdminButton>
                <AdminButton
                  variant="primary"
                  size="sm"
                  onClick={() => handleQuickRestock(product, 10)}
                  loading={restockingId === product.id}
                >
                  +10
                </AdminButton>
                {product.stock <= 0 && product.visible && (
                  <AdminButton variant="danger" size="sm" onClick={() => handleTemporaryHide(product)} loading={restockingId === product.id}>
                    Masquer
                  </AdminButton>
                )}
              </div>

              <Link
                href={`/admin/produits/${product.id}`}
                className="text-sm text-brand-gold hover:underline"
              >
                Ouvrir la fiche produit
              </Link>
            </AdminCard>
          ))}
        </div>
      )}

      {outOfStockProducts.length === 0 && criticalStockProducts.length === 0 && (
        <AdminCard className="border-l-4 border-l-green-500 bg-green-50">
          <div className="flex items-center gap-3">
            <Package size={24} className="text-green-600" />
            <div>
              <p className="font-bebas text-lg text-green-700 uppercase">Aucune alerte critique</p>
              <p className="text-sm text-green-600">Tous les produits visibles ont un stock supérieur à 5 unités.</p>
            </div>
          </div>
        </AdminCard>
      )}
    </div>
  );
}