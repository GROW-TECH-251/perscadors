'use client';

import { useCatalogRealtime } from '@/hooks/useCatalogRealtime';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
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
const hydrationListeners = new Set<() => void>();

// PERF-02 v2 (audit latence 09/2026) : la course effet-parent/effet-enfant
// perdaient l'injection : le provider fetchait AVANT que DataHydrator n'injecte
// son snapshot -> 4 à 10 requêtes REST par page + contenu en 3 états.
export function hydrateCatalogSnapshot(snapshot: PublicCatalogSnapshot): void {
  if (snapshot?.source === 'supabase' && snapshot !== injectedCatalogSnapshot) {
    injectedCatalogSnapshot = snapshot;
    // Notification en microtask : sûre même déclenchée pendant le render
    // d'un autre composant (page streamée).
    const listeners = Array.from(hydrationListeners);
    queueMicrotask(() => listeners.forEach((listener) => listener()));
  }
}

function subscribeCatalogHydration(listener: () => void): () => void {
  hydrationListeners.add(listener);
  return () => {
    hydrationListeners.delete(listener);
  };
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  // PERF-02 v2 : le snapshot injecté (s'il est déjà là au premier render) sert
  // d'état initial — zéro fetch, zéro flash fallback -> base de données.
  const [catalog, setCatalog] = useState(() => injectedCatalogSnapshot ?? fallbackSnapshot);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  // Audit latence 09/2026 : le layout racine enveloppe AUSSI l'admin —
  // inutile d'y charger le catalogue public (≈5 requêtes REST + 1 websocket
  // économisées sur chaque écran admin).
  const pathname = usePathname();
  const isAdminArea = Boolean(pathname?.startsWith('/admin'));

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
    if (isAdminArea) {
      // Admin : le catalogue public n'est pas consommé ici.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sortie immédiate, aucun rendu en cascade
      setIsInitialLoad(false);
      return;
    }
    if (!isInitialLoad) return;
    let cancelled = false;
    const start = async () => {
      // Fenêtre de grâce : le segment page (DataHydrator) s'hydrate souvent
      // juste APRÈS le shell (chunks chargés en cascade). On laisse 60 ms à
      // l'injection serveur pour atterrir AVANT de tomber sur le fetch réseau
      // (zéro requête quand elle arrive ; sinon fetch = dégradation propre).
      await new Promise((resolve) => setTimeout(resolve, 60));
      if (cancelled || injectedCatalogSnapshot) {
        setIsInitialLoad(false);
        return;
      }
      await loadCatalog();
    };
    void start();
    return () => {
      cancelled = true;
    };
  }, [isInitialLoad, isAdminArea, loadCatalog]);

  // Injection tardive (page streamée : DataHydrator monté après le provider) :
  // le snapshot serveur s'applique dès qu'il arrive, avant la fin du fetch.
  useEffect(() => subscribeCatalogHydration(() => {
    if (injectedCatalogSnapshot) {
      setCatalog(injectedCatalogSnapshot);
    }
  }), []);

  // Realtime : recharge seulement quand DB change (produit ajouté/modifié par
  // admin) — désactivé sur l'admin (le catalogue public n'y est pas chargé).
  useCatalogRealtime(
    useCallback(() => {
      if (!isAdminArea) void loadCatalog();
    }, [isAdminArea, loadCatalog]),
    !isAdminArea
  );

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
