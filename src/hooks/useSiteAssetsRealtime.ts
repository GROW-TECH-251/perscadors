'use client';

import { useEffect, useRef } from 'react';
import { subscribeRealtime } from '@/lib/publicRealtime';

/**
 * Écoute Realtime des médias.
 * Impl 6 : canal partagé via src/lib/publicRealtime.ts — un seul canal
 * site_assets pour tous les composants, au lieu d'un canal par montage.
 */
export function useSiteAssetsRealtime(onChange: () => void) {
  const callbackRef = useRef(onChange);

  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const unsubscribe = subscribeRealtime('site_assets', () => callbackRef.current());
    return () => {
      unsubscribe();
    };
  }, []);
}
