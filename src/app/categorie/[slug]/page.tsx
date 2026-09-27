import { Suspense } from 'react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import CategoryPage from './category-client';
import { cache } from 'react';
import { fetchServerCatalogSnapshot } from '@/services/publicCatalogService';

const getSnapshot = cache(fetchServerCatalogSnapshot);
import { categoryMetadata } from '@/lib/seoMetadata';

// SEO serveur (Impl 9) : titre/description/OG par catégorie, présents dans le
// HTML initial. Le composant client (filtres, useSearchParams) reste dans
// category-client, enveloppé dans Suspense (exigence Next pour useSearchParams).
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const snapshot = await getSnapshot();
  const category = snapshot.categories.find((candidate) => candidate.slug === slug);

  return categoryMetadata(category, slug);
}

// E9 — redirections : si le slug n'est plus une catégorie courante mais
// apparaît comme ancien slug (renommage), rediriger côté serveur vers la
// catégorie actuelle. Les bookmarks/SEO des anciennes URLs restent valides.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const snapshot = await getSnapshot();

  if (!snapshot.categories.some((category) => category.slug === slug)) {
    const cible = snapshot.categories.find((category) => (category.former_slugs || []).includes(slug));
    if (cible) redirect(`/categorie/${cible.slug}`);
  }

  return (
    <Suspense fallback={null}>
      <CategoryPage />
    </Suspense>
  );
}
