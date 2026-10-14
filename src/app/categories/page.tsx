// src/app/categories/page.tsx
// P1-1C (finalisation 10/2026) — page publique « Toutes les catégories ».
// SEO serveur sur le même gabarit que /looks : titre/description/OG présents
// dans le HTML initial ; le rendu interactif reste dans categories-client
// (catalogue hydraté par le DataHydrator du layout racine).

import type { Metadata } from 'next';
import { cache } from 'react';
import { fetchServerCatalogSnapshot } from '@/services/publicCatalogService';
import { allCategoriesMetadata } from '@/lib/seoMetadata';
import CategoriesPage from './categories-client';

const getSnapshot = cache(fetchServerCatalogSnapshot);

export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await getSnapshot();
  return allCategoriesMetadata(snapshot.categories);
}

export default function Page() {
  return <CategoriesPage />;
}
