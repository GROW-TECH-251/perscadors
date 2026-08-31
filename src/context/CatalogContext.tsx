'use client';

import { useCatalogRealtime } from '@/hooks/useCatalogRealtime';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CatalogCategory, Outfit, Product } from '@/types';
import {
  fetchPublicCatalogSnapshot,
  findCatalogProductById,
  findCatalogProductsByCategory,
  getFallbackCatalogSnapshot,
  searchCatalogProducts,
  type CatalogSource,
  type PublicCatalogSnapshot
} from '@/services/publicCatalogService';

interface CatalogContextValue {
  products: Product[];
  categories: CatalogCategory[];
  outfits: Outfit[];
  source: CatalogSource;
  findProductById: (id: string) => Product | null;
  getProductsByCategory: (categorySlug: string) => Product[];
  searchProducts: (query: string) => Product[];
}

const CatalogContext = createContext<CatalogContextValue | undefined>(undefined);

const fallbackSnapshot = getFallbackCatalogSnapshot();

// PERF-02 — Hydratation serveur -> client : les pages serveur possèdent déjà
// le snapshot (ISR/metadata) ; DataHydrator l'injecte ici AVANT l'effet de
// montage du provider (effets enfants d'abord), qui l'applique sans AUCUN
// fetch réseau. Garde source === 'supabase' : un snapshot fallback (serveur
// sans base) laisse le client fetcher comme avant — dégradation propre.
let injectedCatalogSnapshot: PublicCatalogSnapshot | null = null;

export function hydrateCatalogSnapshot(snapshot: PublicCatalogSnapshot): void {
  if (snapshot?.source === 'supabase') {
    injectedCatalogSnapshot = snapshot;
  }
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [catalog, setCatalog] = useState(fallbackSnapshot);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const loadCatalog = useCallback(async () => {
    try {
      // PERF-02 : snapshot injecté par le serveur -> zéro requête REST au
      // chargement ; le realtime conserve la fraîcheur par la suite.
      if (injectedCatalogSnapshot) {
        setCatalog(injectedCatalogSnapshot);
        return;
      }
      const snapshot = await fetchPublicCatalogSnapshot();
      setCatalog(snapshot);
    } catch {
      // Fallback silencieux déjà en place
    } finally {
      setIsInitialLoad(false);
    }
  }, []);

  // Performance P0 : Charger une seule fois au mount, pas à chaque changement de pathname
  // Avant : useEffect dépendait de pathname → reload à chaque navigation → latence 2-3s
  // Après : mount une seule fois → pas de re-fetch bloquant navigation
  useEffect(() => {
    if (isInitialLoad) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- initial catalog load, intentional for perf <100ms
      void loadCatalog();
    }
  }, [isInitialLoad, loadCatalog]);

  // Realtime : recharge seulement quand DB change (produit ajouté/modifié par admin)
  useCatalogRealtime(() => {
    void loadCatalog();
  });

  const value = useMemo<CatalogContextValue>(() => ({
    products: catalog.products,
    categories: catalog.categories,
    outfits: catalog.outfits,
    source: catalog.source,
    findProductById: (id: string) => findCatalogProductById(catalog.products, id),
    getProductsByCategory: (categorySlug: string) => findCatalogProductsByCategory(catalog.products, categorySlug),
    searchProducts: (query: string) => searchCatalogProducts(catalog.products, query)
  }), [catalog]);

  return (
    <CatalogContext.Provider value={value}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const context = useContext(CatalogContext);

  if (!context) {
    throw new Error('useCatalog must be used within a CatalogProvider');
  }

  return context;
}
