import { Suspense } from 'react';
import type { Metadata } from 'next';
import CategoryPage from './category-client';
import { fetchServerCatalogSnapshot } from '@/services/publicCatalogService';
import { categoryMetadata } from '@/lib/seoMetadata';

// SEO serveur (Impl 9) : titre/description/OG par catégorie, présents dans le
// HTML initial. Le composant client (filtres, useSearchParams) reste dans
// category-client, enveloppé dans Suspense (exigence Next pour useSearchParams).
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const snapshot = await fetchServerCatalogSnapshot();
  const category = snapshot.categories.find((candidate) => candidate.slug === slug);

  return categoryMetadata(category, slug);
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <CategoryPage />
    </Suspense>
  );
}
