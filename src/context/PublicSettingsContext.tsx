'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchPublicShopSettings,
  getDefaultShopSettings,
  readSeededPublicShopSettings,
} from '@/services/settingsService';
import { useShopSettingsRealtime } from '@/hooks/useShopSettingsRealtime';
import { useSiteAssetsRealtime } from '@/hooks/useSiteAssetsRealtime';
import type { ShopSettings } from '@/admin/types';

// ============================================================================
// Impl 6 — Source unique des réglages publics au niveau du layout.
// Le provider charge les réglages UNE fois (les lectures sont dédupliquées au
// niveau service) et centralise les abonnements Realtime (canal unique via
// publicRealtime.ts). Les composants peuvent continuer d'appeler les services
// directement : ils partagent le même cache en vol, donc aucune requête en plus.
// ============================================================================

interface PublicSettingsContextValue {
  settings: ShopSettings;
  version: number;
  refresh: () => void;
}

const PublicSettingsContext = createContext<PublicSettingsContextValue | null>(null);

export function PublicSettingsProvider({ children }: { children: React.ReactNode }) {
  // Consolidation 09/2026 — fix hydratation : s'initialiser avec la valeur
  // semée par le DataHydrator du layout (render préalable) quand elle existe,
  // pour que le premier render client == HTML serveur (#418).
  const [settings, setSettings] = useState<ShopSettings>(
    () => readSeededPublicShopSettings() ?? getDefaultShopSettings()
  );
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => {
    setVersion((current) => current + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      // Audit latence : même fenêtre de grâce que le catalogue — le DataHydrator
      // du segment page amorce le cache TTL au render ; 60 ms évitent une
      // requête REST quand il arrive juste après le shell.
      await new Promise((resolve) => setTimeout(resolve, 60));
      const data = await fetchPublicShopSettings();
      if (data && isMounted) setSettings(data);
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, [version]);

  useShopSettingsRealtime(refresh);
  useSiteAssetsRealtime(refresh);

  const value = useMemo(
    () => ({ settings, version, refresh }),
    [settings, version, refresh]
  );

  return (
    <PublicSettingsContext.Provider value={value}>
      {children}
    </PublicSettingsContext.Provider>
  );
}

export function usePublicSettings(): PublicSettingsContextValue {
  const context = useContext(PublicSettingsContext);
  // Retour sûr hors provider : ne casse pas l'application en rendu isolé.
  if (!context) {
    return { settings: getDefaultShopSettings(), version: 0, refresh: () => {} };
  }
  return context;
}
