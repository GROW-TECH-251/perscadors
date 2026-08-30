'use client';

// PERF-02 — Pont serveur -> contextes clients. Les pages serveur possèdent
// déjà les données (ISR / generateMetadata) : ce composant les injecte dans
// le CatalogContext et le cache TTL des réglages AVANT l'effet de montage
// des providers (les effets enfants s'exécutent d'abord). Résultat : zéro
// requête REST catalogue/settings au chargement, aucune logique métier
// modifiée, realtime inchangé. Rendu : null (aucun DOM).

import { useEffect } from 'react';
import { hydrateCatalogSnapshot } from '@/context/CatalogContext';
import { seedPublicShopSettingsCache } from '@/services/settingsService';
import type { PublicCatalogSnapshot } from '@/services/publicCatalogService';
import type { ShopSettings } from '@/admin/types';

interface DataHydratorProps {
  snapshot?: PublicCatalogSnapshot | null;
  settings?: ShopSettings | null;
}

export function DataHydrator({ snapshot, settings }: DataHydratorProps) {
  useEffect(() => {
    if (snapshot) hydrateCatalogSnapshot(snapshot);
    if (settings) seedPublicShopSettingsCache(settings);
  }, [snapshot, settings]);

  return null;
}
