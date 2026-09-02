'use client';

// PERF-02 — Pont serveur -> contextes clients. Les pages serveur possèdent
// déjà les données (ISR / generateMetadata) : ce composant les injecte dans
// le CatalogContext et le cache TTL des réglages AVANT l'effet de montage
// des providers (les effets enfants s'exécutent d'abord). Résultat : zéro
// requête REST catalogue/settings au chargement, aucune logique métier
// modifiée, realtime inchangé. Rendu : null (aucun DOM).

import { hydrateCatalogSnapshot } from '@/context/CatalogContext';
import { seedPublicShopSettingsCache } from '@/services/settingsService';
import { seedSiteAssetsCache } from '@/services/mediaService';
import type { PublicCatalogSnapshot } from '@/services/publicCatalogService';
import type { ShopSettings } from '@/admin/types';
import type { SiteAsset } from '@/admin/types';

interface DataHydratorProps {
  snapshot?: PublicCatalogSnapshot | null;
  settings?: ShopSettings | null;
  siteAssets?: SiteAsset[] | null;
}

export function DataHydrator({ snapshot, settings, siteAssets }: DataHydratorProps) {
  // PERF-02 v2 (audit latence 09/2026) : l'injection se fait PENDANT le render
  // (plus dans un effet) : les caches/stores sont prêts AVANT les effets de
  // montage des providers, quel que soit l'ordre d'hydratation ou de streaming
  // (la version par effet perdait la course : re-fetch complet de 4 tables).
  // Idempotent (garde d'identité + TTL) : sûr en StrictMode.
  if (snapshot) hydrateCatalogSnapshot(snapshot);
  if (settings) seedPublicShopSettingsCache(settings);
  if (siteAssets) seedSiteAssetsCache(siteAssets);

  return null;
}
