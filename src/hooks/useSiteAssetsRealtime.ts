'use client';

import { useEffect, useId, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/** Écoute Realtime des médias avec un channel unique par composant. */
export function useSiteAssetsRealtime(onChange: () => void) {
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
      .channel(`perscadors-assets-${subscriptionId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_assets' }, () => {
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
