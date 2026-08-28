import type { Metadata } from 'next';
import ProductPage from './product-detail-client';
import { fetchServerCatalogSnapshot, findCatalogProductById } from '@/services/publicCatalogService';
import { notFoundMetadata, productMetadata } from '@/lib/seoMetadata';

// SEO serveur (Impl 9) : titre/description/OG sont générés côté serveur et
// présents dans le HTML initial (visible par les crawlers sans JavaScript).
// Le rendu interactif reste délégué au composant client product-detail-client.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const snapshot = await fetchServerCatalogSnapshot();
  const product = findCatalogProductById(snapshot.products, id);

  return product ? productMetadata(product) : notFoundMetadata();
}

export default function Page() {
  return <ProductPage />;
}
