'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

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
