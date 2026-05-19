// src/services/customerMetaService.ts
// ============================================
// Service de gestion des métadonnées clients
// ============================================
// Gestion des notes, tags et préférences clients

import { requireSupabase, supabase } from '@/lib/supabase';
import type { CustomerMeta, ApiResponse } from '@/admin/types';

// ============================================
// LECTURE
// ============================================

/**
 * Récupère toutes les métadonnées clients
 */
export async function fetchAllCustomerMeta(): Promise<CustomerMeta[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('customer_meta')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch customer_meta:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère les métadonnées d'un client par téléphone
 */
export async function fetchCustomerMetaByPhone(phone: string): Promise<CustomerMeta | null> {
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
 * Récupère les clients par tag
 */
export async function fetchCustomersByTag(tag: string): Promise<CustomerMeta[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('customer_meta')
    .select('*')
    .contains('tags', [tag])
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch clients par tag:', error);
    return [];
  }

  return data || [];
}

/**
 * Récupère les clients avec des notes
 */
export async function fetchCustomersWithNotes(): Promise<CustomerMeta[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('customer_meta')
    .select('*')
    .not('notes', 'eq', '')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Erreur fetch clients avec notes:', error);
    return [];
  }

  return data || [];
}

// ============================================
// CRÉATION / MISE À JOUR
// ============================================

/**
 * Crée ou met à jour les métadonnées d'un client
 */
export async function upsertCustomerMeta(
  phone: string,
  notes: string = '',
  tags: string[] = []
): Promise<ApiResponse<CustomerMeta>> {
  const db = requireSupabase();

  const existing = await fetchCustomerMetaByPhone(phone);

  if (existing) {
    // Update
    const { data, error } = await db
      .from('customer_meta')
      .update({
        notes,
        tags,
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
        notes,
        tags,
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
 * Ajoute une note à un client
 */
export async function addCustomerNote(
  phone: string,
  note: string,
  append: boolean = true
): Promise<ApiResponse<CustomerMeta>> {
  const existing = await fetchCustomerMetaByPhone(phone);
  
  let newNotes: string;
  if (existing && append) {
    newNotes = existing.notes 
      ? `${existing.notes}\n\n[${new Date().toLocaleDateString('fr-FR')}] ${note}`
      : `[${new Date().toLocaleDateString('fr-FR')}] ${note}`;
  } else {
    newNotes = note;
  }

  return await upsertCustomerMeta(phone, newNotes, existing?.tags || []);
}

/**
 * Ajoute un tag à un client
 */
export async function addCustomerTag(
  phone: string,
  tag: string
): Promise<ApiResponse<CustomerMeta>> {
  const existing = await fetchCustomerMetaByPhone(phone);
  const currentTags = existing?.tags || [];
  
  if (!currentTags.includes(tag)) {
    currentTags.push(tag);
  }

  return await upsertCustomerMeta(phone, existing?.notes || '', currentTags);
}

/**
 * Supprime un tag d'un client
 */
export async function removeCustomerTag(
  phone: string,
  tag: string
): Promise<ApiResponse<CustomerMeta>> {
  const existing = await fetchCustomerMetaByPhone(phone);
  const currentTags = existing?.tags || [];
  
  const updatedTags = currentTags.filter(t => t !== tag);

  return await upsertCustomerMeta(phone, existing?.notes || '', updatedTags);
}

/**
 * Met à jour les tags d'un client
 */
export async function updateCustomerTags(
  phone: string,
  tags: string[]
): Promise<ApiResponse<CustomerMeta>> {
  const existing = await fetchCustomerMetaByPhone(phone);
  return await upsertCustomerMeta(phone, existing?.notes || '', tags);
}

// ============================================
// SUPPRESSION
// ============================================

/**
 * Supprime les métadonnées d'un client
 */
export async function deleteCustomerMeta(phone: string): Promise<ApiResponse<boolean>> {
  const db = requireSupabase();

  const { error } = await db
    .from('customer_meta')
    .delete()
    .eq('phone', phone);

  if (error) {
    console.error('Erreur suppression customer_meta:', error);
    return { data: false, error: error.message };
  }

  return { data: true, error: null };
}

// ============================================
// RECHERCHE
// ============================================

/**
 * Recherche des clients par note
 */
export async function searchCustomersByNote(query: string): Promise<CustomerMeta[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('customer_meta')
    .select('*')
    .ilike('notes', `%${query}%`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Erreur recherche clients par note:', error);
    return [];
  }

  return data || [];
}