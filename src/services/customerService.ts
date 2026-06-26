// src/services/customerService.ts
// ============================================
// Service de gestion des clients
// ============================================
// CRUD et agrégation des données clients via Supabase

import { requireSupabase, supabase } from '@/lib/supabase';
import type { CustomerSummary, CustomerMeta, CustomerSegment, ApiResponse } from '@/admin/types';
import { fetchOrdersByPhone } from './orderService';

// ============================================
// LECTURE
// ============================================

/**
 * Récupère tous les clients (agrégés depuis les commandes)
 */
export async function fetchCustomerSummaries(): Promise<CustomerSummary[]> {
  if (!supabase) return [];

  // Récupérer toutes les commandes
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !orders) {
    console.error('Erreur fetch clients:', error);
    return [];
  }

  // Regrouper par téléphone
  const customerMap = new Map<string, CustomerSummary>();

  orders.forEach((order: {
    client_phone: string;
    client_name: string;
    client_area: string;
    total: number;
    created_at: string;
    status: string;
    items?: Array<{
      size: string;
      color: string;
    }>;
  }) => {
    const phone = order.client_phone;
    const existing = customerMap.get(phone);

    if (!existing) {
      customerMap.set(phone, {
        phone,
        name: order.client_name,
        area: order.client_area,
        orderCount: 1,
        totalSpent: order.total || 0,
        lastOrderDate: order.created_at,
        lastOrderStatus: order.status as CustomerSummary['lastOrderStatus'],
        preferredSizes: [],
        preferredColors: [],
        segments: [],
        notes: '',
        tags: []
      });
    } else {
      existing.orderCount += 1;
      existing.totalSpent += order.total || 0;
      
      // Mettre à jour dernière commande
      if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
        existing.lastOrderDate = order.created_at;
        existing.lastOrderStatus = order.status as CustomerSummary['lastOrderStatus'];
      }

      // Collecter tailles et couleurs préférées
      order.items?.forEach((item) => {
        if (item.size && !existing.preferredSizes.includes(item.size)) {
          existing.preferredSizes.push(item.size);
        }
        if (item.color && !existing.preferredColors.includes(item.color)) {
          existing.preferredColors.push(item.color);
        }
      });
    }
  });

  // Calculer les segments
  const summaries = Array.from(customerMap.values()).map(customer => ({
    ...customer,
    segments: calculateCustomerSegments(customer)
  }));

  return summaries;
}

/**
 * Calcule les segments d'un client
 */
function calculateCustomerSegments(customer: CustomerSummary): CustomerSegment[] {
  const segments: CustomerSegment[] = [];

  // VIP: total dépensé >= 100000 FCFA
  if (customer.totalSpent >= 100000) {
    segments.push('VIP');
  }

  // Fidèle: >= 3 commandes
  if (customer.orderCount >= 3) {
    segments.push('Fidèle');
  }

  // Nouveau: 1 seule commande
  if (customer.orderCount === 1) {
    segments.push('Nouveau');
  }

  // Gros panier: panier moyen >= 50000 FCFA
  const avgOrderValue = customer.totalSpent / customer.orderCount;
  if (avgOrderValue >= 50000) {
    segments.push('Gros panier');
  }

  // À relancer: dernière commande EN ATTENTE
  if (customer.lastOrderStatus === 'EN ATTENTE') {
    segments.push('À relancer');
  }

  // Standard si aucun segment
  if (segments.length === 0) {
    segments.push('Standard');
  }

  return segments;
}

/**
 * Récupère les métadonnées d'un client
 */
export async function fetchCustomerMeta(phone: string): Promise<CustomerMeta | null> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('customer_meta')
    .select('*')
    .eq('phone', phone)
    .single();

  if (error || !data) {
    return null;
  }

  return data as CustomerMeta;
}

/**
 * Récupère un client par téléphone
 */
export async function fetchCustomerByPhone(phone: string): Promise<CustomerSummary | null> {
  const summaries = await fetchCustomerSummaries();
  return summaries.find(c => c.phone === phone) || null;
}

// ============================================
// CRÉATION / MISE À JOUR
// ============================================

/**
 * Crée ou met à jour les métadonnées d'un client
 */
export async function upsertCustomerMeta(
  phone: string,
  meta: Partial<CustomerMeta>
): Promise<ApiResponse<CustomerMeta>> {
  const db = requireSupabase();

  const existing = await fetchCustomerMeta(phone);

  if (existing) {
    // Update
    const { data, error } = await db
      .from('customer_meta')
      .update({
        ...meta,
        updated_at: new Date().toISOString()
      })
      .eq('phone', phone)
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CustomerMeta, error: null };
  } else {
    // Insert
    const { data, error } = await db
      .from('customer_meta')
      .insert([{
        phone,
        notes: meta.notes || '',
        tags: meta.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as CustomerMeta, error: null };
  }
}

/**
 * Ajoute un tag à un client
 */
export async function addCustomerTag(phone: string, tag: string): Promise<ApiResponse<CustomerMeta>> {
  const existing = await fetchCustomerMeta(phone);
  const currentTags = existing?.tags || [];
  
  if (!currentTags.includes(tag)) {
    currentTags.push(tag);
  }

  return await upsertCustomerMeta(phone, { tags: currentTags });
}

/**
 * Supprime un tag d'un client
 */
export async function removeCustomerTag(phone: string, tag: string): Promise<ApiResponse<CustomerMeta>> {
  const existing = await fetchCustomerMeta(phone);
  const currentTags = existing?.tags || [];
  
  const updatedTags = currentTags.filter(t => t !== tag);

  return await upsertCustomerMeta(phone, { tags: updatedTags });
}

// ============================================
// STATISTIQUES
// ============================================

/**
 * Récupère le nombre total de clients uniques
 */
export async function getTotalCustomersCount(): Promise<number> {
  const summaries = await fetchCustomerSummaries();
  return summaries.length;
}