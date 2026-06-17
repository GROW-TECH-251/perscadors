// src/services/customerService.ts
// ============================================
// Service de gestion des clients
// ============================================
// CRUD et agrégation des données clients via Supabase

import { requireSupabase, supabase } from '@/lib/supabase';
import type { CustomerSummary, CustomerMeta, CustomerSegment, ApiResponse } from '@/admin/types';

// ============================================
// LECTURE
// ============================================

export async function fetchCustomerSummaries(): Promise<CustomerSummary[]> {
  if (!supabase) return [];

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error || !orders) {
    console.error('Erreur fetch clients:', error);
    return [];
  }

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

      if (new Date(order.created_at) > new Date(existing.lastOrderDate)) {
        existing.lastOrderDate = order.created_at;
        existing.lastOrderStatus = order.status as CustomerSummary['lastOrderStatus'];
      }

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

  return Array.from(customerMap.values()).map((customer) => ({
    ...customer,
    segments: calculateCustomerSegments(customer)
  }));
}

function calculateCustomerSegments(customer: CustomerSummary): CustomerSegment[] {
  const segments: CustomerSegment[] = [];

  if (customer.totalSpent >= 100000) {
    segments.push('VIP');
  }

  if (customer.orderCount >= 3) {
    segments.push('Fidèle');
  }

  if (customer.orderCount === 1) {
    segments.push('Nouveau');
  }

  const avgOrderValue = customer.totalSpent / customer.orderCount;
  if (avgOrderValue >= 50000) {
    segments.push('Gros panier');
  }

  if (customer.lastOrderStatus === 'EN ATTENTE') {
    segments.push('À relancer');
  }

  if (segments.length === 0) {
    segments.push('Standard');
  }

  return segments;
}

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

export async function fetchCustomerByPhone(phone: string): Promise<CustomerSummary | null> {
  const summaries = await fetchCustomerSummaries();
  return summaries.find((customer) => customer.phone === phone) || null;
}

// ============================================
// CRÉATION / MISE À JOUR
// ============================================

export async function upsertCustomerMeta(
  phone: string,
  meta: Partial<CustomerMeta>
): Promise<ApiResponse<CustomerMeta>> {
  const db = requireSupabase();

  const existing = await fetchCustomerMeta(phone);

  if (existing) {
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
  }

  const { data, error } = await db
    .from('customer_meta')
    .insert([
      {
        phone,
        notes: meta.notes || '',
        tags: meta.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: data as CustomerMeta, error: null };
}

export async function addCustomerTag(phone: string, tag: string): Promise<ApiResponse<CustomerMeta>> {
  const existing = await fetchCustomerMeta(phone);
  const currentTags = existing?.tags || [];

  if (!currentTags.includes(tag)) {
    currentTags.push(tag);
  }

  return await upsertCustomerMeta(phone, { tags: currentTags });
}

export async function removeCustomerTag(phone: string, tag: string): Promise<ApiResponse<CustomerMeta>> {
  const existing = await fetchCustomerMeta(phone);
  const currentTags = existing?.tags || [];
  const updatedTags = currentTags.filter((currentTag) => currentTag !== tag);

  return await upsertCustomerMeta(phone, { tags: updatedTags });
}

// ============================================
// STATISTIQUES
// ============================================

export async function getTotalCustomersCount(): Promise<number> {
  const summaries = await fetchCustomerSummaries();
  return summaries.length;
}