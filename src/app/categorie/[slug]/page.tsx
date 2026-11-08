import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import CategoryPage from './category-client';
import { cache } from 'react';
import { fetchServerCatalogSnapshot } from '@/services/publicCatalogService';
import { safeJsonLd } from '@/utils/safeJsonLd';

const getSnapshot = cache(fetchServerCatalogSnapshot);
import { categoryMetadata } from '@/lib/seoMetadata';

// SEO serveur (Impl 9) : titre/description/OG par catégorie, présents dans le
// HTML initial. Le composant client (filtres, recherche) reste dans
// category-client.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const snapshot = await getSnapshot();
  const category = snapshot.categories.find((candidate) => candidate.slug === slug);

  return categoryMetadata(category, slug);
}

// E9 — redirections : si le slug n'est plus une catégorie courante mais
// apparaît comme ancien slug (renommage), rediriger côté serveur vers la
// catégorie actuelle. Les bookmarks/SEO des anciennes URLs restent valides.
// SEO (31/10) — permanentRedirect (308) au lieu de redirect (307) : un
// renommage est définitif, les moteurs consolident ainsi les signaux sur la
// nouvelle URL au lieu de garder l'ancienne en redirection temporaire.
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const snapshot = await getSnapshot();
  const category = snapshot.categories.find((candidate) => candidate.slug === slug);

  if (!category) {
    const cible = snapshot.categories.find((candidate) => (candidate.former_slugs || []).includes(slug));
    if (cible) permanentRedirect(`/categorie/${cible.slug}`);
  }

  // SEO (31/10) — BreadcrumbList : fil d'Ariane structuré réel (Accueil >
  // Catégorie) pour aider les moteurs à situer la page dans la hiérarchie.
  const categoryName = category?.name || slug.replace(/-/g, ' ');
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://perscadors.vercel.app/' },
      { '@type': 'ListItem', position: 2, name: categoryName, item: `https://perscadors.vercel.app/categorie/${slug}` }
    ]
  };

  // SEO (31/10) — plus de sous-arbre suspendu à fallback vide : ce wrapper
  // permettait le prérendu statique de la page mais figeait une COQUILLE
  // VIDE dans le HTML (useSearchParams => contenu rendu côté client
  // uniquement, texte visible mesuré : 33 caractères). Comme la fiche produit
  // (qui SSR complètement), la page est désormais rendue dynamiquement avec
  // tout son contenu dans le HTML initial — visible par les robots sans
  // JavaScript.
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbSchema) }}
      />
      <CategoryPage />
    </>
  );
}
