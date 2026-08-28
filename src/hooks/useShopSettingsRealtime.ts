'use client';

import { useEffect, useRef } from 'react';
import { isAdminOnce, subscribeRealtime } from '@/lib/publicRealtime';

/**
 * Écoute Realtime de shop_settings.
 * FIX PUB-DATA-01 : shop_settings a RLS revoke select anon
 * (migration limit_public_shop_settings.sql) — seul un admin peut s'y abonner.
 * Pour le public (anon), on ne souscrit pas et ISR revalidate=60 s'applique.
 *
 * Impl 6 : la vérification admin et le canal sont désormais partagés
 * (src/lib/publicRealtime.ts) — plus un auth.getUser() ni un canal par montage.
 */
export function useShopSettingsRealtime(onChange: () => void) {
  const callbackRef = useRef(onChange);

  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    isAdminOnce().then((isAdmin) => {
      if (!isMounted || !isAdmin) return;
      unsubscribe = subscribeRealtime('shop_settings', () => callbackRef.current());
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);
}
