// src/services/orderService.ts
// ============================================
// Service de gestion des commandes
// ============================================
// CRUD complet pour les commandes via Supabase

import { requireSupabase, supabase } from '@/lib/supabase';
import type { AdminOrder, OrderStatus, OrderHistoryEntry, ApiResponse } from '@/admin/types';

// ============================================
// LECTURE
// ============================================

export async function fetchAdminOrders(): Promise<AdminOrder[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch commandes:', error);
    return [];
  }

  return (data || []) as AdminOrder[];
}

export async function fetchOrderById(id: number): Promise<AdminOrder | null> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('orders')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Erreur fetch commande:', error);
    return null;
  }

  return data as AdminOrder;
}

export async function fetchOrderByNumber(orderNumber: string): Promise<AdminOrder | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single();

  if (error || !data) {
    console.error('Erreur fetch commande par numéro:', error);
    return null;
  }

  return data as AdminOrder;
}

export async function fetchOrdersByStatus(status: OrderStatus): Promise<AdminOrder[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch commandes par statut:', error);
    return [];
  }

  return (data || []) as AdminOrder[];
}

export async function fetchOrdersByPhone(phone: string): Promise<AdminOrder[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('client_phone', phone)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch commandes par téléphone:', error);
    return [];
  }

  return (data || []) as AdminOrder[];
}

// ============================================
// CRÉATION
// ============================================

export async function createOrderFromCart(orderData: {
  order_number: string;
  client_name: string;
  client_phone: string;
  client_area: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    size: string;
    color: string;
    image?: string;
  }>;
  subtotal: number;
  delivery_fee: number;
  total: number;
}): Promise<ApiResponse<AdminOrder>> {
  const db = requireSupabase();

  const history: OrderHistoryEntry[] = [
    {
      status: 'EN ATTENTE',
      date: new Date().toISOString(),
      note: 'Commande créée depuis le panier'
    }
  ];

  const { data, error } = await db
    .from('orders')
    .insert([
      {
        ...orderData,
        status: 'EN ATTENTE',
        history,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Erreur création commande:', error);
    return { data: null, error: error.message };
  }

  return { data: data as AdminOrder, error: null };
}

// ============================================
// MISE À JOUR
// ============================================

export async function updateOrderStatus(
  id: number,
  newStatus: OrderStatus,
  note?: string
): Promise<ApiResponse<AdminOrder>> {
  const db = requireSupabase();

  const currentOrder = await fetchOrderById(id);
  if (!currentOrder) {
    return { data: null, error: 'Commande non trouvée' };
  }

  const historyEntry: OrderHistoryEntry = {
    status: newStatus,
    date: new Date().toISOString(),
    note
  };

  const updatedHistory = [...(currentOrder.history || []), historyEntry];

  const { data, error } = await db
    .from('orders')
    .update({
      status: newStatus,
      history: updatedHistory,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour statut commande:', error);
    return { data: null, error: error.message };
  }

  return { data: data as AdminOrder, error: null };
}

export async function updateOrder(
  id: number,
  orderData: Partial<AdminOrder>
): Promise<ApiResponse<AdminOrder>> {
  const db = requireSupabase();

  const { data, error } = await db
    .from('orders')
    .update({
      ...orderData,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur mise à jour commande:', error);
    return { data: null, error: error.message };
  }

  return { data: data as AdminOrder, error: null };
}

// ============================================
// SUPPRESSION
// ============================================

export async function deleteOrder(id: number): Promise<ApiResponse<boolean>> {
  const db = requireSupabase();

  const { error } = await db
    .from('orders')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur suppression commande:', error);
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}

// ============================================
// STATISTIQUES
// ============================================

export async function getTotalOrdersCount(): Promise<number> {
  if (!supabase) return 0;

  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Erreur count commandes:', error);
    return 0;
  }

  return count || 0;
}

export async function getTotalRevenue(): Promise<number> {
  if (!supabase) return 0;

  const { data, error } = await supabase
    .from('orders')
    .select('total')
    .eq('status', 'LIVRÉE');

  if (error) {
    console.error('Erreur calcul revenu:', error);
    return 0;
  }

  return data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
}