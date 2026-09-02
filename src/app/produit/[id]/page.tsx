import type { Metadata } from 'next';
import ProductPage from './product-detail-client';
import { cache } from 'react';
import { fetchServerCatalogSnapshot, findCatalogProductById } from '@/services/publicCatalogService';
import { DataHydrator } from '@/components/public/DataHydrator';
import { fetchServerSiteAssets } from '@/services/mediaService';
import { fetchServerPublicShopSettings } from '@/services/settingsService';

// PERF-02 — wrapper dédupliqué : generateMetadata ET la page partagent le
// même snapshot (un seul fetch serveur par requête).
const getSnapshot = cache(fetchServerCatalogSnapshot);
const getSiteAssets = cache(fetchServerSiteAssets);
const getSettings = cache(fetchServerPublicShopSettings);
import { notFoundMetadata, productMetadata } from '@/lib/seoMetadata';

// SEO serveur (Impl 9) : titre/description/OG sont générés côté serveur et
// présents dans le HTML initial (visible par les crawlers sans JavaScript).
// Le rendu interactif reste délégué au composant client product-detail-client.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const snapshot = await getSnapshot();
  const product = findCatalogProductById(snapshot.products, id);

  return product ? productMetadata(product) : notFoundMetadata();
}

export default async function Page() {
  // PERF-02 — le snapshot serveur hydrate le contexte client (zéro re-fetch).
  const [snapshot, settings, siteAssets] = await Promise.all([getSnapshot(), getSettings(), getSiteAssets()]);
  return (
    <>
      <DataHydrator snapshot={snapshot} settings={settings} siteAssets={siteAssets} />
      <ProductPage />
    </>
  );
}
