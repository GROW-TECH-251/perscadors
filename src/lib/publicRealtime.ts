'use client';

import { supabase } from '@/lib/supabase';
import { invalidatePublicShopSettingsCache } from '@/services/settingsService';
import { invalidateSiteAssetsCache } from '@/services/mediaService';
import type { RealtimeChannel } from '@supabase/supabase-js';

// ============================================================================
// Impl 6 — Realtime unique + vérification admin partagée
// Avant : chaque montage de useShopSettingsRealtime / useSiteAssetsRealtime
// créait son propre canal Supabase (~7 canaux shop_settings + ~4 site_assets)
// et refaisait auth.getUser() + profiles.select('role') à chaque fois.
// Après : UN canal ref-counté par table + UNE vérification admin en cache.
// ============================================================================

type RealtimeTable = 'shop_settings' | 'site_assets';
type Listener = () => void;

const ADMIN_CHECK_TTL_MS = 30_000;
let adminCheck: { value: boolean; expiresAt: number } | null = null;
let adminCheckInFlight: Promise<boolean> | null = null;

/**
 * Vérification unique du rôle admin, partagée par tous les abonnés Realtime.
 * Retourne false pour le public anonyme (on ne souscrit alors pas à
 * shop_settings, qui requiert is_perscadors_admin() — évite les 42501).
 */
export function isAdminOnce(): Promise<boolean> {
  const client = supabase;
  if (!client) return Promise.resolve(false);

  if (adminCheck && adminCheck.expiresAt > Date.now()) {
    return Promise.resolve(adminCheck.value);
  }
  if (!adminCheckInFlight) {
    adminCheckInFlight = (async () => {
      try {
        const { data: { user } } = await client.auth.getUser();
        if (!user) return false;
        const { data: profile } = await client
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();
        return profile?.role === 'admin';
      } catch {
        return false;
      }
    })()
      .then((isAdmin) => {
        adminCheck = { value: isAdmin, expiresAt: Date.now() + ADMIN_CHECK_TTL_MS };
        return isAdmin;
      })
      .finally(() => {
        adminCheckInFlight = null;
      });
  }
  return adminCheckInFlight;
}

interface HubEntry {
  channel: RealtimeChannel;
  listeners: Set<Listener>;
  refCount: number;
  debounce?: ReturnType<typeof setTimeout>;
}

const hubs = new Map<RealtimeTable, HubEntry>();

function flush(entry: HubEntry, table: RealtimeTable): void {
  if (entry.debounce) clearTimeout(entry.debounce);
  entry.debounce = setTimeout(() => {
    // Invalide le cache mémoire AVANT de prévenir les abonnés : les composants
    // qui re-fetchent obtiennent des données fraîches, sans requête en double.
    if (table === 'shop_settings') invalidatePublicShopSettingsCache();
    else invalidateSiteAssetsCache();

    entry.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // Un abonné en erreur ne doit pas bloquer les autres.
      }
    });
  }, 200);
}

/**
 * Abonnement Realtime ref-counté : tous les composants partagent UN seul canal
 * par table. Le canal est fermé quand le dernier abonné se désabonne.
 */
export function subscribeRealtime(table: RealtimeTable, listener: Listener): () => void {
  const client = supabase;
  if (!client) return () => {};

  let entry = hubs.get(table);
  if (!entry) {
    const channel = client.channel(`perscadors-public-${table}`);
    const newEntry: HubEntry = { channel, listeners: new Set(), refCount: 0 };
    channel
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => flush(newEntry, table))
      .subscribe();
    entry = newEntry;
    hubs.set(table, entry);
  }

  entry.listeners.add(listener);
  entry.refCount += 1;

  let removed = false;
  return () => {
    if (removed) return;
    removed = true;

    const current = hubs.get(table);
    if (!current) return;
    current.listeners.delete(listener);
    current.refCount -= 1;
    if (current.refCount <= 0) {
      if (current.debounce) clearTimeout(current.debounce);
      client.removeChannel(current.channel);
      hubs.delete(table);
    }
  };
}
