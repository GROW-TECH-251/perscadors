// src/services/customerService.ts
// ============================================
// Service de gestion des clients : agrégation déterministe des commandes et métadonnées Supabase
// ============================================

import { requireSupabase, supabase } from '@/lib/supabase';
import { fetchAdminOrders, normalizeCustomerPhone } from '@/services/orderService';
import type { AdminOrder, CustomerSummary, CustomerMeta, CustomerSegment, ApiResponse } from '@/admin/types';

export async function fetchCustomerSummaries(): Promise<CustomerSummary[]> {
  const [orders, { data: customerMetaRows, error: customerMetaError }] = await Promise.all([
    fetchAdminOrders(),
    supabase ? supabase.from('customer_meta').select('*') : Promise.resolve({ data: [], error: null })
  ]);

  if (customerMetaError && customerMetaError.code !== 'PGRST205') {
    console.error('Erreur fetch customer_meta:', customerMetaError);
  }

  // Les notes et tags sont les seules données client persistées indépendamment des commandes.
  const customerMetaMap = new Map<string, CustomerMeta>(
    ((customerMetaRows || []) as CustomerMeta[]).map((meta) => [normalizeCustomerPhone(meta.phone), meta])
  );
  const customerMap = new Map<string, CustomerSummary>();
  const seenOrders = new Set<string>();

  (orders as AdminOrder[]).forEach((order) => {
    const phone = normalizeCustomerPhone(order.client_phone);
    if (!phone) return;

    const orderIdentity = order.idempotency_key || order.order_number || `legacy-${order.id}`;
    if (seenOrders.has(orderIdentity)) return;
    seenOrders.add(orderIdentity);

    const existing = customerMap.get(phone);
    if (!existing) {
      customerMap.set(phone, {
        phone, name: order.client_name, area: order.client_area, orderCount: 1,
        totalSpent: order.total || 0, lastOrderDate: order.created_at,
        lastOrderStatus: order.status, preferredSizes: [], preferredColors: [], segments: [], notes: '', tags: []
      });
    } else {
      existing.orderCount += 1;
      existing.totalSpent += order.total || 0;
      if (new Date(order.created_at).getTime() >= new Date(existing.lastOrderDate).getTime()) {
        existing.lastOrderDate = order.created_at;
        existing.lastOrderStatus = order.status;
        existing.name = order.client_name;
        existing.area = order.client_area;
      }
    }

    const customer = customerMap.get(phone);
    if (!customer) return;
    order.items?.forEach((item) => {
      if (item.size && !customer.preferredSizes.includes(item.size)) customer.preferredSizes.push(item.size);
      if (item.color && !customer.preferredColors.includes(item.color)) customer.preferredColors.push(item.color);
    });
  });

  // 3. Fusion avec les clients du cache localStorage (commandes non encore synchronisees Supabase)
  if (typeof window !== 'undefined') {
    try {
      const cachedCustomers: CustomerSummary[] = JSON.parse(window.localStorage.getItem('__PERSCADORS_CUSTOMERS_CACHE__') || '[]');
      cachedCustomers.forEach((cached) => {
        if (!customerMap.has(cached.phone)) {
          customerMap.set(cached.phone, cached);
        }
      });
    } catch {
      // Silencieux
    }
  }

  return Array.from(customerMap.values())
    .map((customer) => {
      const meta = customerMetaMap.get(customer.phone);
      return { ...customer, notes: meta?.notes || '', tags: meta?.tags || [], segments: calculateCustomerSegments(customer) };
    })
    .sort((first, second) => new Date(second.lastOrderDate).getTime() - new Date(first.lastOrderDate).getTime());
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
  const normalizedPhone = normalizeCustomerPhone(phone);

  const { data, error } = await db
    .from('customer_meta')
    .select('*')
    .eq('phone', normalizedPhone)
    .single();

  if (error || !data) {
    return null;
  }

  return data as CustomerMeta;
}

export async function fetchCustomerByPhone(phone: string): Promise<CustomerSummary | null> {
  const summaries = await fetchCustomerSummaries();
  const normalizedPhone = normalizeCustomerPhone(phone);
  return summaries.find((customer) => customer.phone === normalizedPhone) || null;
}

export async function upsertCustomerMeta(
  phone: string,
  meta: Partial<CustomerMeta>
): Promise<ApiResponse<CustomerMeta>> {
  const db = requireSupabase();
  const normalizedPhone = normalizeCustomerPhone(phone);
  if (!normalizedPhone) return { data: null, error: 'Numéro de téléphone client invalide.' };

  const existing = await fetchCustomerMeta(normalizedPhone);

  if (existing) {
    const { data, error } = await db
      .from('customer_meta')
      .update({
        ...meta,
        updated_at: new Date().toISOString()
      })
      .eq('phone', normalizedPhone)
      .select()
      .single();

    if (error) {
      console.error('Erreur sauvegarde métadonnées client:', error);
      return { data: null, error: 'Impossible d’enregistrer la fiche client pour le moment.' };
    }

    return { data: data as CustomerMeta, error: null };
  }

  const { data, error } = await db
    .from('customer_meta')
    .insert([
      {
        phone: normalizedPhone,
        notes: meta.notes || '',
        tags: meta.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Erreur création métadonnées client:', error);
    return { data: null, error: 'Impossible d’enregistrer la fiche client pour le moment.' };
  }

  return { data: data as CustomerMeta, error: null };
}

export async function deleteCustomer(phone: string): Promise<ApiResponse<boolean>> {
  const normalizedPhone = normalizeCustomerPhone(phone);
  if (!normalizedPhone) return { data: null, error: 'Numéro de téléphone client invalide.' };

  // Seules les commandes locales en attente sont concernées ; les statistiques client
  // sont toujours recalculées à partir des commandes disponibles.
  if (typeof window !== 'undefined') {
    try {
      const savedOrders = JSON.parse(window.localStorage.getItem('__PERSCADORS_ORDERS_CACHE__') || '[]');
      window.localStorage.setItem('__PERSCADORS_ORDERS_CACHE__', JSON.stringify(
        savedOrders.filter((order: { client_phone?: string }) => normalizeCustomerPhone(order.client_phone || '') !== normalizedPhone)
      ));
    } catch {
      // Ignorer silencieusement
    }
  }

  if (!supabase) return { data: true, error: null };

  const db = requireSupabase();
  const { error: metaError } = await db.from('customer_meta').delete().eq('phone', normalizedPhone);
  const { error: ordersError } = await db.from('orders').delete().eq('client_phone', normalizedPhone);

  if (metaError || ordersError) {
    console.error('Erreur suppression client:', metaError || ordersError);
    return { data: null, error: 'Impossible de supprimer ce client pour le moment.' };
  }

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
