'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { invalidateAdminOrdersCache } from '@/services/orderService';

/** Recharge les écrans admin lorsqu'une commande est créée ou modifiée par un autre utilisateur. */
export function useOrdersRealtime(onChange: () => void) {
  const callbackRef = useRef(onChange);
  useEffect(() => { callbackRef.current = onChange; }, [onChange]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = client
      .channel('perscadors-admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        // PERF-05 — le realtime invalide le cache de session : le refetch
        // déclenché ci-dessous lit la base, jamais une valeur périmée.
        invalidateAdminOrdersCache();
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => callbackRef.current(), 250);
      })
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      client.removeChannel(channel);
    };
  }, []);
}
