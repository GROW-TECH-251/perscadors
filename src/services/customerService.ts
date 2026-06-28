// src/services/customerService.ts
// ============================================
// Service de gestion des clients (Cadre Final : Raccordement au LocalStorage & Zéro Perte)
// ============================================
// CRUD et agrégation des données clients via Supabase et LocalStorage

import { requireSupabase, supabase } from '@/lib/supabase';
import { fetchAdminOrders } from '@/services/orderService';
import type { CustomerSummary, CustomerMeta, CustomerSegment, ApiResponse } from '@/admin/types';

interface RawOrderCustomerRow {
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
}

export async function fetchCustomerSummaries(): Promise<CustomerSummary[]> {
  // 1. CORRECTION CAPITALE : Utiliser fetchAdminOrders() au lieu de supabase.from('orders') !
  // Ainsi, on récupère instantanément les commandes du localStorage et le nouveau client s'affiche immédiatement dans l'admin !
  const [orders, { data: customerMetaRows, error: customerMetaError }] = await Promise.all([
    fetchAdminOrders(),
    supabase ? supabase.from('customer_meta').select('*') : Promise.resolve({ data: [], error: null })
  ]);

  if (!orders) {
    return [];
  }

  // Interception propre de l'erreur PGRST205 (table customer_meta manquante)
  if (customerMetaError && customerMetaError.code !== 'PGRST205') {
    console.error('Erreur fetch customer_meta:', customerMetaError);
  }

  const customerMetaMap = new Map<string, CustomerMeta>(
    ((customerMetaRows || []) as CustomerMeta[]).map((customerMeta) => [customerMeta.phone, customerMeta])
  );

  const customerMap = new Map<string, CustomerSummary>();

  (orders as RawOrderCustomerRow[]).forEach((order) => {
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
    }

    const targetCustomer = customerMap.get(phone);
    if (!targetCustomer) {
      return;
    }

    order.items?.forEach((item) => {
      if (item.size && !targetCustomer.preferredSizes.includes(item.size)) {
        targetCustomer.preferredSizes.push(item.size);
      }
      if (item.color && !targetCustomer.preferredColors.includes(item.color)) {
        targetCustomer.preferredColors.push(item.color);
      }
    });
  });

  return Array.from(customerMap.values())
    .map((customer) => {
      const customerMeta = customerMetaMap.get(customer.phone);

      return {
        ...customer,
        notes: customerMeta?.notes || '',
        tags: customerMeta?.tags || [],
        segments: calculateCustomerSegments(customer)
      };
    })
    .sort((firstCustomer, secondCustomer) => {
      return new Date(secondCustomer.lastOrderDate).getTime() - new Date(firstCustomer.lastOrderDate).getTime();
    });
}

function calculateCustomerSegments(customer: CustomerSummary): CustomerSegment[] {
  const segments: CustomerSegment[] = [];

  // CORRECTION CADRE FINAL : Le client devient VIP dès 50 000 FCFA de dépenses !
  if (customer.totalSpent >= 50000) {
    segments.push('VIP');
  }

  if (customer.orderCount >= 3) {
    segments.push('Fidèle');
  }

  if (customer.orderCount === 1) {
    segments.push('Nouveau');
  }

  const avgOrderValue = customer.totalSpent / customer.orderCount;
  if (avgOrderValue >= 50000 && !segments.includes('VIP')) {
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

export async function deleteCustomer(phone: string): Promise<ApiResponse<boolean>> {
  // Purge en mémoire locale (localStorage)
  if (typeof window !== 'undefined') {
    try {
      const savedOrders = JSON.parse(window.localStorage.getItem('__PERSCADORS_ORDERS_CACHE__') || '[]');
      window.localStorage.setItem('__PERSCADORS_ORDERS_CACHE__', JSON.stringify(savedOrders.filter((o: { client_phone?: string }) => o.client_phone !== phone)));
    } catch {
      // Ignorer silencieusement
    }
  }

  if (!supabase) {
    return { data: true, error: null };
  }

  const db = requireSupabase();
  // Suppression de la fiche customer_meta et des commandes liées
  await db.from('customer_meta').delete().eq('phone', phone);
  await db.from('orders').delete().eq('client_phone', phone);

  return { data: true, error: null };
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

export async function getTotalCustomersCount(): Promise<number> {
  const summaries = await fetchCustomerSummaries();
  return summaries.length;
}
