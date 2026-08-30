import type { Metadata } from 'next';
import HPLooksPage from './hp-looks-client';
import { cache } from 'react';
import { fetchServerCatalogSnapshot } from '@/services/publicCatalogService';
import { DataHydrator } from '@/components/public/DataHydrator';

const getSnapshot = cache(fetchServerCatalogSnapshot);
import { looksMetadata } from '@/lib/seoMetadata';

// SEO serveur (Impl 9) : titre/description/OG générés côté serveur, présents
// dans le HTML initial. Le rendu interactif reste dans hp-looks-client.
export async function generateMetadata(): Promise<Metadata> {
  const snapshot = await getSnapshot();
  return looksMetadata(snapshot.outfits);
}

export default async function Page() {
  const snapshot = await getSnapshot();
  return (
    <>
      <DataHydrator snapshot={snapshot} />
      <HPLooksPage />
    </>
  );
}
