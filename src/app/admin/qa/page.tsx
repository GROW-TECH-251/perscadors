// src/app/admin/qa/page.tsx
// ============================================
// Checklist QA opérationnelle
// ============================================

'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminCard, AdminButton } from '@/admin/components';
import { CheckSquare, Square, RefreshCw, Save, AlertTriangle, Package, ShoppingCart, FileText, Tag, Users } from 'lucide-react';
import { fetchAdminProducts } from '@/services/productService';
import { fetchAdminOrders } from '@/services/orderService';
import { fetchCategories } from '@/services/categoryService';
import { fetchCustomerSummaries } from '@/services/customerService';
import { fetchContentPosts } from '@/services/contentService';
import type { AdminOrder, AdminProduct, ContentPost, CustomerSummary, AdminCategory } from '@/admin/types';

interface ManualChecklistItem {
  id: string;
  category: string;
  label: string;
  checked: boolean;
}

interface QaAuditMetric {
  id: string;
  label: string;
  value: string;
  status: 'success' | 'warning' | 'danger';
  hint: string;
  icon: React.ReactNode;
}

const STORAGE_KEY = 'perscadors-qa-checklist';

const DEFAULT_CHECKLIST: ManualChecklistItem[] = [
  { id: 'm1', category: 'Catalogue', label: 'Vérifier les produits mis en avant sur la vitrine', checked: false },
  { id: 'm2', category: 'Catalogue', label: 'Contrôler les catégories visibles et leurs visuels', checked: false },
  { id: 'm3', category: 'Commandes', label: 'Traiter toutes les commandes en attente du jour', checked: false },
  { id: 'm4', category: 'Commandes', label: 'Vérifier les messages WhatsApp de suivi', checked: false },
  { id: 'm5', category: 'Contenus', label: 'Publier ou programmer les contenus du jour', checked: false },
  { id: 'm6', category: 'Qualité', label: 'Vérifier la cohérence mobile / desktop après mise à jour', checked: false }
];

function readStoredChecklist(): ManualChecklistItem[] {
  if (typeof window === 'undefined') {
    return DEFAULT_CHECKLIST;
  }

  const rawChecklist = window.localStorage.getItem(STORAGE_KEY);
  if (!rawChecklist) {
    return DEFAULT_CHECKLIST;
  }

  try {
    return JSON.parse(rawChecklist) as ManualChecklistItem[];
  } catch (error) {
    console.error('Erreur lecture checklist QA:', error);
    return DEFAULT_CHECKLIST;
  }
}

export default function AdminQaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [contentPosts, setContentPosts] = useState<ContentPost[]>([]);
  const [manualChecklist, setManualChecklist] = useState<ManualChecklistItem[]>(readStoredChecklist);

  const loadQaData = useCallback(async () => {
    setLoading(true);
    try {
      const [productsData, ordersData, categoriesData, customersData, contentData] = await Promise.all([
        fetchAdminProducts(),
        fetchAdminOrders(),
        fetchCategories(),
        fetchCustomerSummaries(),
        fetchContentPosts()
      ]);

      setProducts(productsData);
      setOrders(ordersData);
      setCategories(categoriesData);
      setCustomers(customersData);
      setContentPosts(contentData);
    } catch (error: unknown) {
      console.error('Erreur chargement QA:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await loadQaData();
    };
    init();
  }, [loadQaData]);

  const productsWithoutImage = useMemo(() => products.filter((product) => !product.image_url), [products]);
  const lowStockProducts = useMemo(() => products.filter((product) => product.stock > 0 && product.stock <= 5), [products]);
  const hiddenCategories = useMemo(() => categories.filter((category) => !category.visible), [categories]);
  const pendingOrders = useMemo(() => orders.filter((order) => order.status === 'EN ATTENTE'), [orders]);
  const publishedContent = useMemo(() => contentPosts.filter((post) => post.status === 'published'), [contentPosts]);

  const auditMetrics = useMemo<QaAuditMetric[]>(() => {
    return [
      {
        id: 'products-images',
        label: 'Produits sans image',
        value: String(productsWithoutImage.length),
        status: productsWithoutImage.length === 0 ? 'success' : 'warning',
        hint: productsWithoutImage.length === 0 ? 'Tous les produits visibles ont une image.' : 'Ajoute une image aux produits incomplets.',
        icon: <Package size={18} />
      },
      {
        id: 'stock-critical',
        label: 'Stock critique',
        value: String(lowStockProducts.length),
        status: lowStockProducts.length === 0 ? 'success' : lowStockProducts.length <= 3 ? 'warning' : 'danger',
        hint: lowStockProducts.length === 0 ? 'Aucun produit en stock faible.' : 'Prépare un réassort rapide.',
        icon: <AlertTriangle size={18} />
      },
      {
        id: 'orders-pending',
        label: 'Commandes en attente',
        value: String(pendingOrders.length),
        status: pendingOrders.length === 0 ? 'success' : pendingOrders.length <= 5 ? 'warning' : 'danger',
        hint: pendingOrders.length === 0 ? 'Tout est traité.' : 'Vérifie les commandes à valider.',
        icon: <ShoppingCart size={18} />
      },
      {
        id: 'categories-hidden',
        label: 'Collections masquées',
        value: String(hiddenCategories.length),
        status: hiddenCategories.length === 0 ? 'success' : 'warning',
        hint: hiddenCategories.length === 0 ? 'Toutes les collections sont visibles.' : 'Assure-toi que les collections masquées sont volontaires.',
        icon: <Tag size={18} />
      },
      {
        id: 'content-published',
        label: 'Contenus publiés',
        value: String(publishedContent.length),
        status: publishedContent.length > 0 ? 'success' : 'warning',
        hint: publishedContent.length > 0 ? 'Le storytelling de la boutique est actif.' : 'Publie un contenu pour animer la vitrine.',
        icon: <FileText size={18} />
      },
      {
        id: 'customers-known',
        label: 'Clients suivis',
        value: String(customers.length),
        status: customers.length > 0 ? 'success' : 'warning',
        hint: customers.length > 0 ? 'La base clients est disponible pour le CRM.' : 'Aucun client n’a encore été agrégé.',
        icon: <Users size={18} />
      }
    ];
  }, [customers.length, hiddenCategories.length, lowStockProducts.length, pendingOrders.length, productsWithoutImage.length, publishedContent.length]);

  const manualProgress = Math.round((manualChecklist.filter((item) => item.checked).length / manualChecklist.length) * 100);
  const groupedChecklist = useMemo(() => {
    return manualChecklist.reduce((accumulator, item) => {
      if (!accumulator[item.category]) {
        accumulator[item.category] = [];
      }
      accumulator[item.category].push(item);
      return accumulator;
    }, {} as Record<string, ManualChecklistItem[]>);
  }, [manualChecklist]);

  const toggleChecklistItem = (id: string) => {
    setManualChecklist((currentItems) =>
      currentItems.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleSaveChecklist = () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(manualChecklist));
    alert('Checklist QA sauvegardée !');
  };

  const handleResetChecklist = () => {
    if (!window.confirm('Réinitialiser la checklist QA ?')) {
      return;
    }

    setManualChecklist(DEFAULT_CHECKLIST);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CHECKLIST));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-gold mx-auto mb-4" />
          <p className="text-brand-text-muted">Audit QA en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-bebas text-3xl tracking-wider text-brand-text uppercase">Checklist QA</h1>
          <p className="text-brand-text-muted mt-1">Pilotage qualité avant livraison client ou mise en production</p>
        </div>
        <div className="flex gap-3">
          <AdminButton variant="secondary" onClick={() => router.push('/admin')}>Retour</AdminButton>
          <AdminButton variant="secondary" onClick={() => loadQaData()}>
            <RefreshCw size={16} />
            Rafraîchir l’audit
          </AdminButton>
          <AdminButton variant="primary" onClick={handleSaveChecklist}>
            <Save size={16} />
            Sauvegarder
          </AdminButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {auditMetrics.map((metric) => (
          <AdminCard key={metric.id} className={`border-l-4 ${
            metric.status === 'success'
              ? 'border-l-green-500'
              : metric.status === 'warning'
                ? 'border-l-yellow-500'
                : 'border-l-red-500'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-wider text-brand-text-muted mb-2">{metric.label}</p>
                <p className="font-bebas text-4xl text-brand-text">{metric.value}</p>
                <p className="text-sm text-brand-text-muted mt-2">{metric.hint}</p>
              </div>
              <div className="p-3 rounded-lg bg-brand-gold/10 text-brand-gold">
                {metric.icon}
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      <AdminCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bebas text-xl tracking-wider text-brand-text uppercase">Progression manuelle</h2>
          <span className="text-2xl font-bold text-brand-gold">{manualProgress}%</span>
        </div>
        <div className="w-full h-4 bg-brand-bg rounded-full overflow-hidden">
          <div className="h-full bg-brand-gold transition-all duration-500" style={{ width: `${manualProgress}%` }} />
        </div>
        <p className="text-sm text-brand-text-muted mt-2">
          {manualChecklist.filter((item) => item.checked).length} / {manualChecklist.length} étapes validées
        </p>
      </AdminCard>

      {Object.entries(groupedChecklist).map(([category, items]) => (
        <AdminCard key={category}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bebas text-xl tracking-wider text-brand-text uppercase">{category}</h2>
            <button
              type="button"
              onClick={handleResetChecklist}
              className="text-sm text-brand-text-muted hover:text-brand-gold cursor-pointer"
            >
              Réinitialiser
            </button>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => toggleChecklistItem(item.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-brand-gold/5 transition-colors text-left cursor-pointer"
              >
                {item.checked ? (
                  <CheckSquare size={20} className="text-brand-gold flex-shrink-0" />
                ) : (
                  <Square size={20} className="text-brand-text-muted flex-shrink-0" />
                )}
                <span className={`text-brand-text ${item.checked ? 'line-through text-brand-text-muted' : ''}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </AdminCard>
      ))}

      {manualProgress === 100 && auditMetrics.every((metric) => metric.status !== 'danger') && (
        <AdminCard className="border-l-4 border-l-green-500 bg-green-50">
          <div className="text-center py-6">
            <CheckSquare size={48} className="mx-auto text-green-500 mb-4" />
            <h2 className="font-bebas text-2xl text-green-700 uppercase">
              QA prête pour validation finale
            </h2>
            <p className="text-green-600 mt-2">
              Le back-office a passé l’audit fonctionnel et la checklist manuelle.
            </p>
          </div>
        </AdminCard>
      )}
    </div>
  );
}