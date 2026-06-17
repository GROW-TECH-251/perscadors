// src/app/admin/produits/page.tsx
// ============================================
// Gestion des Produits - Liste
// ============================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton, AdminSearch, AdminEmptyState, AdminBadge } from '@/admin/components';
import { Package, Plus, Edit, Trash2, Download } from 'lucide-react';
import { fetchAdminProducts, deleteProduct } from '@/services/productService';
import type { AdminProduct } from '@/admin/types';
import { exportProductsToCsv } from '@/utils/exportCsv';

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden' | 'low-stock'>('all');

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminProducts();
      setProducts(data);
    } catch (error: unknown) {
      console.error('Erreur chargement produits:', error);
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

  const handleDelete = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      return;
    }

    try {
      const result = await deleteProduct(id);
      if (result.error) {
        alert(result.error);
        return;
      }
      await loadProducts();
    } catch (error: unknown) {
      console.error('Erreur suppression produit:', error);
      alert('Erreur lors de la suppression');
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'visible' && product.visible) ||
      (filter === 'hidden' && !product.visible) ||
      (filter === 'low-stock' && (product.stock || 0) <= 5);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Chargement des produits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">Produits</h1>
          <p className="text-brand-text-muted mt-1">{products.length} produits</p>
        </div>
        <div className="flex gap-3">
          <AdminButton variant="secondary" onClick={() => router.push('/admin')}>
            Retour
          </AdminButton>
          <AdminButton variant="primary" onClick={() => router.push('/admin/produits/nouveau')}>
            <Plus size={20} />
            Nouveau produit
          </AdminButton>
          <AdminButton variant="secondary" onClick={() => exportProductsToCsv(products)}>
            <Download size={20} />
            Export CSV
          </AdminButton>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <AdminSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Rechercher un produit..."
          className="flex-1"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === 'all'
                ? 'bg-brand-gold text-[#0A0A0A]'
                : 'bg-brand-bg-alt text-brand-text hover:bg-brand-gold/10'
            }`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('visible')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === 'visible'
                ? 'bg-brand-gold text-[#0A0A0A]'
                : 'bg-brand-bg-alt text-brand-text hover:bg-brand-gold/10'
            }`}
          >
            Visibles
          </button>
          <button
            onClick={() => setFilter('low-stock')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              filter === 'low-stock'
                ? 'bg-brand-gold text-[#0A0A0A]'
                : 'bg-brand-bg-alt text-brand-text hover:bg-brand-gold/10'
            }`}
          >
            Stock faible
          </button>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <AdminEmptyState
          icon={<Package size={48} />}
          title="Aucun produit"
          description={searchQuery || filter !== 'all' ? 'Essayez d\'autres filtres' : 'Ajoutez votre premier produit'}
          action={
            !searchQuery ? (
              <AdminButton variant="primary" onClick={() => router.push('/admin/produits/nouveau')}>
                <Plus size={20} />
                Ajouter un produit
              </AdminButton>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <AdminCard key={product.id} className="p-0 overflow-hidden">
              <div className="relative aspect-square bg-brand-bg">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand-text-muted">
                    <Package size={48} />
                  </div>
                )}

                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  {!product.visible && <AdminBadge variant="default">Caché</AdminBadge>}
                  {(product.stock || 0) <= 5 && (product.stock || 0) > 0 && (
                    <AdminBadge variant="danger">Stock faible</AdminBadge>
                  )}
                  {product.badge && <AdminBadge variant="success">{product.badge}</AdminBadge>}
                  {product.stock <= 0 && <AdminBadge variant="danger">Épuisé</AdminBadge>}
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-bebas text-lg text-brand-text uppercase leading-tight truncate">
                    {product.name}
                  </h3>
                  <p className="text-xs text-brand-text-muted mt-1">{product.category}</p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-brand-gold">
                    {product.price.toLocaleString()} FCFA
                  </span>
                  <span className="text-xs text-brand-text-muted">
                    Stock: {product.stock}
                  </span>
                </div>

                <div className="flex gap-2 pt-3 border-t border-brand-gold/10">
                  <AdminButton
                    variant="secondary"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/admin/produits/${product.id}`)}
                  >
                    <Edit size={14} />
                    Modifier
                  </AdminButton>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                    type="button"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </AdminCard>
          ))}
        </div>
      )}
    </div>
  );
}