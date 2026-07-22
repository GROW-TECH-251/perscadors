'use client';

import { useEffect, useId, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/** Écoute Realtime par composant sans réutiliser un channel déjà abonné. */
export function useShopSettingsRealtime(onChange: () => void) {
  const callbackRef = useRef(onChange);
  const subscriptionId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = client
      .channel(`perscadors-settings-${subscriptionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_settings' }, () => {
        if (timer) clearTimeout(timer);
        timer = setTimeout(() => callbackRef.current(), 200);
      })
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      client.removeChannel(channel);
    };
  }, [subscriptionId]);
}
