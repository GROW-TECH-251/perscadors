import { Suspense } from 'react';
import type { Metadata } from 'next';
import CategoryPage from './category-client';
import { cache } from 'react';
import { fetchServerCatalogSnapshot } from '@/services/publicCatalogService';
import { DataHydrator } from '@/components/public/DataHydrator';
import { fetchServerSiteAssets } from '@/services/mediaService';
import { fetchServerPublicShopSettings } from '@/services/settingsService';

const getSnapshot = cache(fetchServerCatalogSnapshot);
const getSiteAssets = cache(fetchServerSiteAssets);
const getSettings = cache(fetchServerPublicShopSettings);
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

export default async function Page() {
  const [snapshot, settings, siteAssets] = await Promise.all([getSnapshot(), getSettings(), getSiteAssets()]);
  return (
    <Suspense fallback={null}>
      <DataHydrator snapshot={snapshot} settings={settings} siteAssets={siteAssets} />
      <CategoryPage />
    </Suspense>
  );
}
