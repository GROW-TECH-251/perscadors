// src/app/admin/produits/page.tsx
// ============================================
// Gestion des Produits - Liste (Levier 1 : Quick Inline Editing)
// ============================================

'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton, AdminSearch, AdminEmptyState } from '@/admin/components';
import { Package, Plus, Edit, Trash2, Download, Check, X, Eye, EyeOff } from 'lucide-react';
import { fetchAdminProducts, deleteProduct, updateProduct } from '@/services/productService';
import type { AdminProduct } from '@/admin/types';
import { exportProductsToCsv } from '@/utils/exportCsv';

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden' | 'low-stock'>('all');

  // États pour l'édition rapide en ligne du prix (Quick Inline Editing)
  const [editingPriceId, setEditingPriceId] = useState<number | null>(null);
  const [tempPrice, setTempPrice] = useState<number>(0);
  const [savingId, setSavingId] = useState<number | null>(null);

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

  // ============================================
  // LEVIER 1 : QUICK INLINE EDITING (Vitesse WhatsApp)
  // ============================================

  // 1. Bascule d'affichage en 1 clic (Toggle Visibility)
  const handleToggleVisibility = async (id: number, nextVisible: boolean) => {
    setSavingId(id);
    try {
      // Mise à jour optimiste locale pour une réactivité instantanée à l'écran
      setProducts((currentProducts) =>
        currentProducts.map((p) => (p.id === id ? { ...p, visible: nextVisible } : p))
      );
      await updateProduct(id, { visible: nextVisible });
    } catch (err: unknown) {
      console.error('Erreur bascule visibilité:', err);
      alert('Erreur lors de la mise à jour de la visibilité');
      await loadProducts(); // Rollback en cas d'erreur
    } finally {
      setSavingId(null);
    }
  };

  // 2. Sauvegarde du prix en ligne (Inline Price Edit)
  const handleSavePrice = async (id: number) => {
    setSavingId(id);
    try {
      setProducts((currentProducts) =>
        currentProducts.map((p) => (p.id === id ? { ...p, price: tempPrice } : p))
      );
      setEditingPriceId(null);
      await updateProduct(id, { price: tempPrice });
    } catch (err: unknown) {
      console.error('Erreur sauvegarde prix:', err);
      alert('Erreur lors de la sauvegarde du prix');
      await loadProducts();
    } finally {
      setSavingId(null);
    }
  };

  // 3. Bascule d'une taille en "Épuisé" instantanément (Quick Stock Toggling)
  const handleToggleSizeStock = async (id: number, size: string, currentOutOfStock: string[]) => {
    setSavingId(id);
    const isCurrentlyOutOfStock = currentOutOfStock.includes(size);
    const updatedOutOfStock = isCurrentlyOutOfStock
      ? currentOutOfStock.filter((s) => s !== size)
      : [...currentOutOfStock, size];

    try {
      setProducts((currentProducts) =>
        currentProducts.map((p) => (p.id === id ? { ...p, outOfStockSizes: updatedOutOfStock } : p))
      );
      await updateProduct(id, { outOfStockSizes: updatedOutOfStock });
    } catch (err: unknown) {
      console.error('Erreur bascule stock taille:', err);
      alert('Erreur lors de la mise à jour du stock pour cette taille');
      await loadProducts();
    } finally {
      setSavingId(null);
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
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <span className="inline-flex items-center rounded-full bg-brand-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            Catalogue pilotable en 1 clic
          </span>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase mt-3">Produits</h1>
          <p className="text-brand-text-muted mt-1">{products.length} produits configurables</p>
        </div>
        <div className="flex flex-wrap gap-3">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredProducts.map((product, index) => {
            const isEditingPrice = editingPriceId === product.id;
            const outOfStockList = product.outOfStockSizes || [];

            return (
              <AdminCard key={`product-${product.id}-${index}`} className="p-0 overflow-hidden relative group/card border-brand-gold/15 hover:border-brand-gold/40 transition-all shadow-md hover:shadow-xl">
                {/* Product Image */}
                <div className="relative aspect-square bg-brand-bg overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      alt={product.name}
                      fill
                      sizes="(max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover/card:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-brand-text-muted">
                      <Package size={48} />
                    </div>
                  )}

                  {/* Badges Flottants en Verre Dépoli */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
                    {!product.visible ? (
                      <span className="px-2.5 py-1 bg-gray-900/90 text-gray-400 border border-gray-700 text-xs font-semibold rounded-lg backdrop-blur-sm flex items-center gap-1.5">
                        <EyeOff size={12} /> Caché
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 bg-emerald-950/90 text-emerald-400 border border-emerald-800 text-xs font-semibold rounded-lg backdrop-blur-sm flex items-center gap-1.5">
                        <Eye size={12} /> Visible
                      </span>
                    )}
                    {(product.stock || 0) <= 5 && (product.stock || 0) > 0 && (
                      <span className="px-2.5 py-1 bg-red-950/90 text-red-400 border border-red-800 text-xs font-semibold rounded-lg backdrop-blur-sm">
                        Stock faible ({product.stock})
                      </span>
                    )}
                    {product.badge && (
                      <span className="px-2.5 py-1 bg-brand-gold/20 text-brand-gold border border-brand-gold/40 text-xs font-semibold rounded-lg backdrop-blur-sm">
                        {product.badge}
                      </span>
                    )}
                    {product.stock <= 0 && (
                      <span className="px-2.5 py-1 bg-red-950/90 text-red-400 border border-red-800 text-xs font-semibold rounded-lg backdrop-blur-sm">
                        Épuisé
                      </span>
                    )}
                  </div>

                  {/* Levier 1 : Toggle Visibility Switch en 1 Clic */}
                  <div className="absolute top-3 right-3 flex gap-2 z-10">
                    <button
                      onClick={() => handleToggleVisibility(product.id, !product.visible)}
                      disabled={savingId === product.id}
                      className={`p-2.5 rounded-full shadow-lg transition-all duration-300 active:scale-95 cursor-pointer backdrop-blur-sm ${
                        product.visible
                          ? 'bg-emerald-500 text-[#0A0A0A] hover:bg-emerald-400'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                      }`}
                      title={product.visible ? 'Masquer le produit' : 'Rendre visible'}
                      aria-label="Bascule visibilité"
                    >
                      {product.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2.5 bg-red-950/80 text-red-400 hover:bg-red-600 hover:text-white rounded-full shadow-lg transition-all duration-300 active:scale-95 cursor-pointer backdrop-blur-sm opacity-0 group-hover/card:opacity-100"
                      type="button"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Overlay subtil */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent opacity-80 pointer-events-none" />
                </div>

                {/* Product Info */}
                <div className="p-5 space-y-4 bg-brand-bg-alt relative z-20">
                  <div>
                    <h3 className="font-bebas text-xl sm:text-2xl text-brand-text uppercase leading-tight truncate break-words max-w-full">
                      {product.name}
                    </h3>
                    <p className="text-xs text-brand-text-muted uppercase tracking-widest mt-0.5 truncate">
                      {product.category.replace(/-/g, ' ')}
                    </p>
                  </div>

                  {/* Levier 1 : Édition du prix en ligne (Inline Price Edit) */}
                  <div className="flex items-center justify-between py-2 border-y border-brand-gold/10">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-text-muted block mb-1">
                        Prix de vente (Clic pour modifier)
                      </span>
                      {isEditingPrice ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={tempPrice}
                            onChange={(e) => setTempPrice(Number(e.target.value) || 0)}
                            className="w-28 px-2 py-1 bg-brand-bg border border-brand-gold rounded text-brand-gold font-bold text-lg focus:outline-none"
                            aria-label={`Modifier le prix de ${product.name}`}
                            title={`Prix pour ${product.name}`}
                            autoFocus
                          />
                          <button
                            onClick={() => handleSavePrice(product.id)}
                            className="p-1.5 bg-brand-gold text-[#0A0A0A] rounded hover:bg-brand-gold-light transition-colors cursor-pointer"
                            type="button"
                            aria-label="Valider prix"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => setEditingPriceId(null)}
                            className="p-1.5 bg-gray-800 text-gray-400 rounded hover:bg-gray-700 hover:text-white transition-colors cursor-pointer"
                            type="button"
                            aria-label="Annuler prix"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPriceId(product.id);
                            setTempPrice(product.price);
                          }}
                          className="font-bebas text-2xl text-brand-gold hover:text-brand-gold-light transition-colors cursor-pointer flex items-center gap-1 group/price"
                          type="button"
                          title="Modifier le prix rapidement"
                        >
                          <span>{product.price.toLocaleString()} FCFA</span>
                          <Edit size={14} className="text-brand-text-muted group-hover/price:text-brand-gold opacity-0 group-hover/price:opacity-100 transition-opacity ml-1" />
                        </button>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-text-muted block mb-1">
                        Stock dispo
                      </span>
                      <span className="text-sm font-medium text-brand-text">
                        {product.stock !== undefined && product.stock !== null ? product.stock : '∞'}
                      </span>
                    </div>
                  </div>

                  {/* Levier 1 : Tailles interactives en 1 clic (Toggle Stock Tailles) */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-text-muted block">
                      Disponibilité par taille (Clic pour basculer en Épuisé)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {product.sizes?.map((size) => {
                        const isOutOfStock = outOfStockList.includes(size);
                        return (
                          <button
                            key={size}
                            type="button"
                            onClick={() => handleToggleSizeStock(product.id, size, outOfStockList)}
                            disabled={savingId === product.id}
                            className={`px-3 py-1.5 rounded-lg font-bebas text-sm uppercase tracking-wider transition-all duration-200 active:scale-95 cursor-pointer border ${
                              isOutOfStock
                                ? 'bg-gray-900 text-gray-600 border-gray-800 line-through opacity-60 hover:opacity-100 hover:border-brand-gold/40'
                                : 'bg-brand-gold/10 text-brand-text border-brand-gold/20 hover:border-brand-gold hover:text-brand-bg hover:bg-brand-gold shadow-sm'
                            }`}
                            title={isOutOfStock ? 'Marquer disponible' : 'Marquer épuisé'}
                          >
                            {size} {isOutOfStock ? '❌' : '✅'}
                          </button>
                        );
                      })}
                      {!product.sizes?.length && (
                        <span className="text-xs text-brand-text-muted italic">Aucune taille définie</span>
                      )}
                    </div>
                  </div>

                  {/* Actions d'édition complète */}
                  <div className="pt-2 border-t border-brand-gold/10">
                    <AdminButton
                      variant="secondary"
                      size="sm"
                      className="w-full justify-center gap-2"
                      onClick={() => router.push(`/admin/produits/${product.id}`)}
                    >
                      <Edit size={14} />
                      Édition complète de la fiche
                    </AdminButton>
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
