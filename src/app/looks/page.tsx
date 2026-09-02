import type { Metadata } from 'next';
import HPLooksPage from './hp-looks-client';
import { cache } from 'react';
import { fetchServerCatalogSnapshot } from '@/services/publicCatalogService';
import { DataHydrator } from '@/components/public/DataHydrator';
import { fetchServerSiteAssets } from '@/services/mediaService';
import { fetchServerPublicShopSettings } from '@/services/settingsService';

const getSnapshot = cache(fetchServerCatalogSnapshot);
const getSiteAssets = cache(fetchServerSiteAssets);
const getSettings = cache(fetchServerPublicShopSettings);
import { looksMetadata } from '@/lib/seoMetadata';

// SEO serveur (Impl 9) : titre/description/OG générés côté serveur, présents
// dans le HTML initial. Le rendu interactif reste dans hp-looks-client.
export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await getSnapshot();
  return looksMetadata(snapshot.outfits);
}

export default async function Page() {
  const [snapshot, settings, siteAssets] = await Promise.all([getSnapshot(), getSettings(), getSiteAssets()]);
  return (
    <>
      <DataHydrator snapshot={snapshot} settings={settings} siteAssets={siteAssets} />
      <HPLooksPage />
    </>
  );
}
