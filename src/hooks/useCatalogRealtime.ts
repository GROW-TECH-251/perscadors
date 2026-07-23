'use client';
import { useEffect, useId, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export function useCatalogRealtime(onChange: () => void) {
  const callbackRef = useRef(onChange);
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  useEffect(() => { callbackRef.current = onChange; }, [onChange]);
  useEffect(() => {
    const client = supabase;
    if (!client) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = client.channel(`perscadors-catalog-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'outfits' }, schedule)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, schedule)
      .subscribe();
    function schedule() { if (timer) clearTimeout(timer); timer = setTimeout(() => callbackRef.current(), 200); }
    return () => { if (timer) clearTimeout(timer); client.removeChannel(channel); };
  }, [id]);
}
