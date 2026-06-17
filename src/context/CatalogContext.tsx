'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { CatalogCategory, Outfit, Product } from '@/types';
import {
  fetchPublicCatalogSnapshot,
  findCatalogProductById,
  findCatalogProductsByCategory,
  getFallbackCatalogSnapshot,
  searchCatalogProducts,
  type CatalogSource
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

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [catalog, setCatalog] = useState(fallbackSnapshot);

  useEffect(() => {
    if (pathname.startsWith('/admin')) {
      return;
    }

    let cancelled = false;

    const loadCatalog = async () => {
      const snapshot = await fetchPublicCatalogSnapshot();

      if (!cancelled) {
        setCatalog(snapshot);
      }
    };

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

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