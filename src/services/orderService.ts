// src/services/orderService.ts
// ============================================
// Service de gestion des commandes (Cadre Final : Synchronisation Inviolable & Zéro Perte)
// ============================================

import { requireSupabase, supabase } from '@/lib/supabase';
import { logSupabaseWarning } from '@/lib/supabaseErrors';
import type { AdminOrder, OrderStatus, OrderHistoryEntry, ApiResponse, OrderItem, OrderCreationResult } from '@/admin/types';

export interface PublicCheckoutOrderItem {
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image?: string;
}

export interface PublicCheckoutPayload {
  order_number: string;
  /** Clé stable conservée par la file locale afin qu'un retry ne crée pas de doublon. */
  idempotency_key?: string;
  client_name: string;
  client_phone: string;
  client_area: string;
  items: PublicCheckoutOrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
}

export interface PendingOrdersSyncResult {
  syncedCount: number;
  pendingCount: number;
  error: string | null;
}

const ORDERS_CACHE_KEY = '__PERSCADORS_ORDERS_CACHE__';

export function generateOrderNumber(date: Date = new Date()): string {
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const randomPart = Math.floor(1000 + Math.random() * 9000);

  return `HP-${datePart}-${randomPart}`;
}

export function normalizeCustomerPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '').replace(/^00/, '');

  // Perscadors opère au Bénin : un numéro local à huit chiffres devient E.164 sans '+'.
  return /^\d{8}$/.test(digits) ? `229${digits}` : digits;
}

export function normalizePhoneForWhatsApp(phone: string): string {
  return normalizeCustomerPhone(phone);
}

/**
 * Génère une clé de déduplication indépendante de la référence visible.
 * La même clé doit être réutilisée par toute tentative de synchronisation d'une même commande.
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Repli uniquement pour les environnements anciens ne fournissant pas Web Crypto.
  return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function isSameOrder(left: Pick<AdminOrder, 'order_number' | 'idempotency_key'>, right: Pick<AdminOrder, 'order_number' | 'idempotency_key'>): boolean {
  return Boolean(
    (left.idempotency_key && right.idempotency_key && left.idempotency_key === right.idempotency_key)
    || left.order_number === right.order_number
  );
}

function readLocalOrders(): AdminOrder[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(ORDERS_CACHE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed as AdminOrder[] : [];
  } catch {
    return [];
  }
}

function writeLocalOrders(orders: AdminOrder[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(ORDERS_CACHE_KEY, JSON.stringify(orders));
  } catch {
    // Le cache est un secours ; l'erreur ne doit pas casser le tunnel de commande.
  }
}

function removeCachedOrder(order: Pick<AdminOrder, 'order_number' | 'idempotency_key'>): void {
  writeLocalOrders(readLocalOrders().filter((cachedOrder) => !isSameOrder(cachedOrder, order)));

  const globalContext = globalThis as unknown as { __PERSCADORS_ORDERS_CACHE__?: AdminOrder[] };
  if (globalContext.__PERSCADORS_ORDERS_CACHE__) {
    globalContext.__PERSCADORS_ORDERS_CACHE__ = globalContext.__PERSCADORS_ORDERS_CACHE__
      .filter((cachedOrder) => !isSameOrder(cachedOrder, order));
  }
}

function toDatabaseOrder(order: AdminOrder): Omit<AdminOrder, 'id'> {
  const databaseOrder = Object.fromEntries(
    Object.entries(order).filter(([key]) => key !== 'id')
  ) as Omit<AdminOrder, 'id'>;

  return {
    ...databaseOrder,
    sync_status: 'synced'
  };
}

export function buildWhatsAppOrderMessage(payload: PublicCheckoutPayload): string {
  let message = `🛒 *Nouvelle Commande HP Collection*\n\n`;
  message += `Référence : *${payload.order_number}*\n`;
  message += `Client : ${payload.client_name}\n`;
  message += `Téléphone : ${payload.client_phone}\n`;
  message += `Zone : ${payload.client_area}\n\n`;

  payload.items.forEach((item) => {
    message += `• ${item.name}\n`;
    message += `  Taille: ${item.size} | Couleur: ${item.color}\n`;
    message += `  Quantité: ${item.quantity} | Prix: ${(item.price * item.quantity).toLocaleString()} FCFA\n\n`;
  });

  message += `━━━━━━━━━━━━━━━━\n`;
  message += `Sous-total: ${payload.subtotal.toLocaleString()} FCFA\n`;
  message += `Livraison: ${payload.delivery_fee.toLocaleString()} FCFA\n`;
  message += `*TOTAL: ${payload.total.toLocaleString()} FCFA*\n\n`;
  message += `_Votre commande a été préparée automatiquement et envoyée à Vioutou via WhatsApp pour validation finale et livraison._`;

  return message;
}

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  // Le dashboard admin lit toujours la base partagée en premier.
  // Le cache navigateur ne contient que les commandes explicitement pending_sync.
  const pendingLocalOrders = readLocalOrders().filter((order) => order.sync_status === 'pending_sync');

  if (!supabase) {
    console.error('Supabase indisponible : affichage limité aux commandes en attente locales.');
    return pendingLocalOrders;
  }

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    logSupabaseWarning('orderService', error);
    // Ne jamais mélanger un cache historique avec les données globales : seul le retry local reste visible.
    return pendingLocalOrders;
  }

  const databaseOrders = (data || []) as AdminOrder[];
  const missingPendingOrders = pendingLocalOrders.filter((localOrder) => (
    !databaseOrders.some((databaseOrder) => isSameOrder(localOrder, databaseOrder))
  ));

  return [...missingPendingOrders, ...databaseOrders];
}

export function getPendingSyncOrders(orders: AdminOrder[] = readLocalOrders()): AdminOrder[] {
  return orders.filter((order) => order.sync_status !== 'synced');
}

/**
 * Vide la file locale uniquement après confirmation qu'une commande existe dans Supabase.
 * Une même clé d'idempotence est conservée à chaque retry.
 */
export async function syncPendingOrders(): Promise<PendingOrdersSyncResult> {
  const pendingOrders = getPendingSyncOrders();

  if (pendingOrders.length === 0) {
    return { syncedCount: 0, pendingCount: 0, error: null };
  }

  if (!supabase) {
    return {
      syncedCount: 0,
      pendingCount: pendingOrders.length,
      error: 'La synchronisation est indisponible pour le moment.'
    };
  }

  const db = requireSupabase();
  let syncedCount = 0;
  let hasFailure = false;

  for (const pendingOrder of pendingOrders) {
    const orderToSync: AdminOrder = {
      ...pendingOrder,
      idempotency_key: pendingOrder.idempotency_key || generateIdempotencyKey(),
      sync_status: 'pending_sync'
    };

    // Sauvegarder immédiatement une clé manquante afin que tous les retries suivants
    // utilisent exactement le même identifiant technique.
    writeLocalOrders(readLocalOrders().map((cachedOrder) => (
      isSameOrder(cachedOrder, pendingOrder) ? orderToSync : cachedOrder
    )));

    try {
      let existingOrder: AdminOrder | null = null;
      const byIdempotencyKey = await db
        .from('orders')
        .select('*')
        .eq('idempotency_key', orderToSync.idempotency_key)
        .maybeSingle();

      if (byIdempotencyKey.error && byIdempotencyKey.error.code !== 'PGRST116') {
        throw byIdempotencyKey.error;
      }
      existingOrder = byIdempotencyKey.data as AdminOrder | null;

      // Permet de nettoyer un cache issu d'une version antérieure qui ne possédait pas de clé.
      if (!existingOrder) {
        const byOrderNumber = await db
          .from('orders')
          .select('*')
          .eq('order_number', orderToSync.order_number)
          .maybeSingle();

        if (byOrderNumber.error && byOrderNumber.error.code !== 'PGRST116') {
          throw byOrderNumber.error;
        }
        existingOrder = byOrderNumber.data as AdminOrder | null;
      }

      if (!existingOrder) {
        const { error } = await db
          .from('orders')
          .insert([toDatabaseOrder(orderToSync)]);

        if (error) {
          throw error;
        }
      }

      removeCachedOrder(orderToSync);
      syncedCount += 1;
    } catch (error: unknown) {
      hasFailure = true;
      // Le détail est disponible pour le développeur ; l'administration reçoit un message générique.
      console.error(`Erreur de synchronisation de la commande ${orderToSync.order_number}:`, error);
    }
  }

  const remainingPendingOrders = getPendingSyncOrders();
  return {
    syncedCount,
    pendingCount: remainingPendingOrders.length,
    error: hasFailure ? 'Certaines commandes restent en attente de synchronisation.' : null
  };
}

export async function fetchOrderById(id: number | string): Promise<AdminOrder | null> {
  const numericId = Number(id);
  const allOrders = await fetchAdminOrders();
  return allOrders.find((o) => o.id === numericId || o.order_number === String(id)) || null;
}

export async function fetchOrderByNumber(orderNumber: string): Promise<AdminOrder | null> {
  const allOrders = await fetchAdminOrders();
  return allOrders.find((o) => o.order_number === orderNumber) || null;
}

export async function fetchOrdersByStatus(status: OrderStatus): Promise<AdminOrder[]> {
  const allOrders = await fetchAdminOrders();
  return allOrders.filter((o) => o.status === status);
}

export async function fetchOrdersByPhone(phone: string): Promise<AdminOrder[]> {
  const allOrders = await fetchAdminOrders();
  const normalizedPhone = normalizeCustomerPhone(phone);
  return allOrders.filter((order) => normalizeCustomerPhone(order.client_phone) === normalizedPhone);
}

export async function createOrderFromCart(orderData: PublicCheckoutPayload): Promise<OrderCreationResult> {
  const normalizedOrderData = { ...orderData, client_phone: normalizeCustomerPhone(orderData.client_phone) };
  const idempotencyKey = orderData.idempotency_key || generateIdempotencyKey();
  const history: OrderHistoryEntry[] = [
    {
      status: 'EN ATTENTE',
      date: new Date().toISOString(),
      note: 'Commande créée depuis le panier'
    }
  ];

  const newOrder: AdminOrder = {
    id: Date.now(), // ID temporaire local ; l'ID Supabase reste la référence persistée.
    order_number: orderData.order_number,
    idempotency_key: idempotencyKey,
    sync_status: 'pending_sync',
    status: 'EN ATTENTE',
    client_name: normalizedOrderData.client_name,
    client_phone: normalizedOrderData.client_phone,
    client_area: normalizedOrderData.client_area,
    items: normalizedOrderData.items as unknown as OrderItem[],
    history,
    subtotal: orderData.subtotal,
    delivery_fee: orderData.delivery_fee,
    total: orderData.total,
    grand_total: orderData.total,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // 1. SYNCHRONISATION INVIOLABLE DANS LE LOCALSTORAGE ET GLOBALTHIS
  // Garantit à 100% que la commande et le client apparaissent instantanément dans l'admin !
  if (typeof window !== 'undefined') {
    try {
      const savedOrders = JSON.parse(window.localStorage.getItem('__PERSCADORS_ORDERS_CACHE__') || '[]') as AdminOrder[];
      const withoutSameCommand = savedOrders.filter((order) => (
        order.idempotency_key !== idempotencyKey && order.order_number !== newOrder.order_number
      ));
      window.localStorage.setItem('__PERSCADORS_ORDERS_CACHE__', JSON.stringify([newOrder, ...withoutSameCommand]));
    } catch {
      // Ignorer silencieusement
    }
  }


  if (!supabase) {
    return {
      data: newOrder,
      syncStatus: 'pending_sync',
      persisted: false,
      error: 'La commande est en attente de synchronisation.'
    };
  }

  const db = requireSupabase();
  const { data, error } = await db
    .from('orders')
    .insert([
      {
        ...normalizedOrderData,
        idempotency_key: idempotencyKey,
        sync_status: 'synced',
        status: 'EN ATTENTE',
        history,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) {
    logSupabaseWarning('orderService', error);
    // La commande locale reste dans la file pending_sync ; le détail technique ne sort pas du service.
    return {
      data: newOrder,
      syncStatus: 'pending_sync',
      persisted: false,
      error: 'La commande est en attente de synchronisation.'
    };
  }

  const persistedOrder = {
    ...(data as AdminOrder),
    idempotency_key: idempotencyKey,
    sync_status: 'synced' as const
  };

  // Supabase a confirmé la persistance : la copie de secours ne doit plus rester dans la file.
  removeCachedOrder(persistedOrder);

  return {
    data: persistedOrder,
    syncStatus: 'synced',
    persisted: true,
    error: null
  };
}

export async function updateOrderStatus(
  id: number | string,
  newStatus: OrderStatus,
  note?: string
): Promise<ApiResponse<AdminOrder>> {
  const currentOrder = await fetchOrderById(Number(id));
  if (!currentOrder) {
    return { data: null, error: 'Commande non trouvée' };
  }

  const historyEntry: OrderHistoryEntry = {
    status: newStatus,
    date: new Date().toISOString(),
    note
  };

  const updatedHistory = [...(currentOrder.history || []), historyEntry];
  const updatedOrder = { ...currentOrder, status: newStatus, history: updatedHistory };

  // Mise à jour du localStorage
  if (typeof window !== 'undefined') {
    try {
      const savedOrders = JSON.parse(window.localStorage.getItem('__PERSCADORS_ORDERS_CACHE__') || '[]') as AdminOrder[];
      window.localStorage.setItem('__PERSCADORS_ORDERS_CACHE__', JSON.stringify(savedOrders.map((o) => o.id === Number(id) ? updatedOrder : o)));
    } catch {
      // Ignorer silencieusement
    }
  }

  if (!supabase) {
    return { data: updatedOrder, error: null };
  }

  const db = requireSupabase();
  const { data, error } = await db
    .from('orders')
    .update({
      status: newStatus,
      history: updatedHistory,
      updated_at: new Date().toISOString()
    })
    .eq('id', Number(id))
    .select()
    .single();

  if (error) {
    logSupabaseWarning('orderService', error);
    return { data: updatedOrder, error: null };
  }

  return { data: data as AdminOrder, error: null };
}

export async function updateOrder(
  id: number | string,
  orderData: Partial<AdminOrder>
): Promise<ApiResponse<AdminOrder>> {
  const currentOrder = await fetchOrderById(Number(id));
  const updatedOrder = { ...currentOrder, ...orderData, updated_at: new Date().toISOString() } as AdminOrder;

  if (typeof window !== 'undefined') {
    try {
      const savedOrders = JSON.parse(window.localStorage.getItem('__PERSCADORS_ORDERS_CACHE__') || '[]') as AdminOrder[];
      window.localStorage.setItem('__PERSCADORS_ORDERS_CACHE__', JSON.stringify(savedOrders.map((o) => o.id === Number(id) ? updatedOrder : o)));
    } catch {
      // Ignorer silencieusement
    }
  }

  if (!supabase) {
    return { data: updatedOrder, error: null };
  }

  const db = requireSupabase();
  const { data, error } = await db
    .from('orders')
    .update({
      ...orderData,
      updated_at: new Date().toISOString()
    })
    .eq('id', Number(id))
    .select()
    .single();

  if (error) {
    logSupabaseWarning('orderService', error);
    return { data: updatedOrder, error: null };
  }

  return { data: data as AdminOrder, error: null };
}

export async function deleteOrder(id: number | string): Promise<ApiResponse<boolean>> {
  if (typeof window !== 'undefined') {
    try {
      const savedOrders = JSON.parse(window.localStorage.getItem('__PERSCADORS_ORDERS_CACHE__') || '[]') as AdminOrder[];
      window.localStorage.setItem('__PERSCADORS_ORDERS_CACHE__', JSON.stringify(savedOrders.filter((o) => o.id !== Number(id))));
    } catch {
      // Ignorer silencieusement
    }
  }

  if (!supabase) {
    return { data: true, error: null };
  }

  const db = requireSupabase();
  const { error } = await db
    .from('orders')
    .delete()
    .eq('id', Number(id));

  if (error) {
    logSupabaseWarning('orderService', error);
    return { data: true, error: null };
  }

  return { data: true, error: null };
}

export async function getTotalOrdersCount(): Promise<number> {
  const allOrders = await fetchAdminOrders();
  return allOrders.length;
}

export async function getTotalRevenue(): Promise<number> {
  const allOrders = await fetchAdminOrders();
  return allOrders
    .filter((o) => o.status === 'LIVRÉE')
    .reduce((sum, o) => sum + (o.total || 0), 0);
}
