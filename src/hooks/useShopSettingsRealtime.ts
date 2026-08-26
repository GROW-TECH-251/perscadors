'use client';

import { useEffect, useId, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/** Écoute Realtime par composant sans réutiliser un channel déjà abonné.
 *  FIX PUB-DATA-01 : Évite permission denied for table shop_settings pour anon
 *  - shop_settings a RLS revoke select anon (migration limit_public_shop_settings.sql)
 *  - Seuls les admins peuvent SELECT shop_settings via is_perscadors_admin()
 *  - Pour le public (anon), on ne souscrit pas à shop_settings realtime, on s'appuie sur ISR revalidate 60s
 *  - Pour l'admin, on souscrit normalement
 *  - Ainsi plus de logs 42501 permission denied dans Supabase postgres logs
 */
export function useShopSettingsRealtime(onChange: () => void) {
  const callbackRef = useRef(onChange);
  const subscriptionId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const client = supabase;
    if (!client) return;

    let isMounted = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let channel: ReturnType<typeof client.channel> | undefined;

    // Vérifie si l'utilisateur est admin avant de souscrire à shop_settings (qui nécessite is_perscadors_admin)
    // Pour anon/public, on skip la souscription realtime et on laisse ISR gérer
    (async () => {
      try {
        const { data: { user } } = await client.auth.getUser();
        // Si pas de user (anon public), on ne souscrit pas à shop_settings (évite permission denied)
        // Le public utilise public_shop_settings view qui n'a pas de realtime, mais ISR 60s suffit
        if (!user) {
          return;
        }

        // Pour les utilisateurs authentifiés, on vérifie le rôle admin
        // Si pas admin, on ne souscrit pas non plus (évite 401)
        const { data: profile } = await client.from('profiles').select('role').eq('id', user.id).maybeSingle();
        if (profile?.role !== 'admin') {
          return;
        }

        if (!isMounted) return;

        channel = client
          .channel(`perscadors-settings-${subscriptionId}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: 'shop_settings' }, () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => callbackRef.current(), 200);
          })
          .subscribe();
      } catch {
        // En cas d'erreur, ne pas bloquer, laisser ISR gérer
      }
    })();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
      if (channel) {
        client.removeChannel(channel);
      }
    };
  }, [subscriptionId]);
}
