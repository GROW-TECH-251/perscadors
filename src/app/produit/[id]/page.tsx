import type { Metadata } from 'next';
import ProductPage from './product-detail-client';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { fetchServerCatalogSnapshot, findCatalogProductById } from '@/services/publicCatalogService';
import { safeJsonLd } from '@/utils/safeJsonLd';

// PERF-02 — wrapper dédupliqué : generateMetadata ET la page partagent le
// même snapshot (un seul fetch serveur par requête).
const getSnapshot = cache(fetchServerCatalogSnapshot);
import { productMetadata } from '@/lib/seoMetadata';

// SEO serveur (Impl 9) : titre/description/OG sont générés côté serveur et
// présents dans le HTML initial (visible par les crawlers sans JavaScript).
// Le rendu interactif reste délégué au composant client product-detail-client.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const snapshot = await getSnapshot();
  const product = findCatalogProductById(snapshot.products, id);

  // SEO (31/10) — la décision 404 est prise dans generateMetadata (résolu
  // AVANT le premier flush du shell de streaming) : notFound() ici produit
  // un VRAI statut 404. Lancé depuis la page seule, le loading.tsx racine
  // aurait déjà fait partir la réponse en 200 (soft-404).
  if (!product) notFound();

  return productMetadata(product);
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snapshot = await getSnapshot();
  const product = findCatalogProductById(snapshot.products, id);

  // SEO (31/10) — vrai 404 pour les produits inexistants/masqués : avant, la
  // route répondait 200 avec un écran « Article introuvable » (soft-404) qui
  // polluait l'index et le budget d'exploration. Le sitemap ne référençait
  // déjà que les produits visibles.
  if (!product) notFound();

  // SEO (31/10) — BreadcrumbList réel : Accueil > Catégorie > Produit.
  const categoryName =
    snapshot.categories.find((candidate) => candidate.slug === product.category)?.name ||
    product.category.replace(/-/g, ' ');
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://perscadors.vercel.app/' },
      { '@type': 'ListItem', position: 2, name: categoryName, item: `https://perscadors.vercel.app/categorie/${product.category}` },
      { '@type': 'ListItem', position: 3, name: product.name, item: `https://perscadors.vercel.app/produit/${product.id}` }
    ]
  };

  // PERF-02 — le snapshot serveur hydrate le contexte client (zéro re-fetch).
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}
      />
      <ProductPage />
    </>
  );
}
