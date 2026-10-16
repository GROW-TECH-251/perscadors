import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// LOT 2 (10/2026) — garde des aperçus d'images produits : les zones
// d'EXAMEN (formulaires admin, liste produits, stock, commandes, bestsellers,
// aperçu d'upload médias, image principale de la fiche publique, photo de
// demande d'article) affichent l'image ENTIÈRE (object-contain, proportions
// conservées). Les cadrages commerciaux volontaires (cartes catégories,
// cartes produits du catalogue, carrousels, hero, miniatures de navigation)
// restent en object-cover — identité visuelle du site.

const APERÇUS_CONTAIN: Array<{ fichier: string; marqueur: string; zone: string }> = [
  { fichier: 'src/app/admin/produits/nouveau/page.tsx', marqueur: 'className="object-contain"', zone: 'formulaire d’ajout (aperçu)' },
  { fichier: 'src/app/admin/produits/[id]/page.tsx', marqueur: 'className="object-contain"', zone: 'formulaire d’édition (aperçu)' },
  { fichier: 'src/app/admin/produits/page.tsx', marqueur: 'object-contain transition-transform duration-500 group-hover/card:scale-105', zone: 'liste des produits (Dashboard)' },
  { fichier: 'src/app/admin/stock/page.tsx', marqueur: 'className="object-contain"', zone: 'stock (miniature d’identification)' },
  { fichier: 'src/app/admin/commandes/page.tsx', marqueur: 'className="object-contain"', zone: 'commandes (vignettes articles)' },
  { fichier: 'src/app/admin/page.tsx', marqueur: 'object-contain group-hover/bestseller:scale-105', zone: 'accueil admin (bestsellers)' },
  { fichier: 'src/app/admin/media/page.tsx', marqueur: 'alt="Preview" fill sizes="320px" className="object-contain"', zone: 'médias (aperçu avant upload)' },
  { fichier: 'src/app/produit/[id]/product-detail-client.tsx', marqueur: 'relative z-10 object-contain transition-transform', zone: 'fiche produit publique (image principale)' },
  { fichier: 'src/components/public/home/ArticleRequestSection.tsx', marqueur: 'className="object-contain"', zone: 'demande d’article (aperçu photo)' }
];

const CADRAGES_COMMERCIAUX_COVER: Array<{ fichier: string; marqueur: string; zone: string }> = [
  { fichier: 'src/components/public/CategoryCard.tsx', marqueur: 'object-cover transition-all duration-(--motion-reveal)', zone: 'cartes catégories (cadrage artistique)' },
  { fichier: 'src/app/categorie/[slug]/category-client.tsx', marqueur: 'object-cover transition-transform duration-500 group-hover:scale-105', zone: 'cartes produits du catalogue' },
  { fichier: 'src/components/public/ProductLightbox.tsx', marqueur: 'className="object-contain"', zone: 'lightbox (agrandissement — image entière)' }
];

describe('Unit — LOT 2 : aperçus d’images produits (contain) vs cadrages commerciaux (cover)', () => {
  it('chaque zone d’examen affiche l’image entière (object-contain)', async () => {
    for (const { fichier, marqueur, zone } of APERÇUS_CONTAIN) {
      const source = await readFile(fichier, 'utf-8');
      expect(source, `${zone} (${fichier})`).toContain(marqueur);
    }
  });

  it('les cadrages commerciaux volontaires et le lightbox restent intacts', async () => {
    for (const { fichier, marqueur, zone } of CADRAGES_COMMERCIAUX_COVER) {
      const source = await readFile(fichier, 'utf-8');
      expect(source, `${zone} (${fichier})`).toContain(marqueur);
    }
  });

  it('les aperçus administratifs ne recoupent plus l’image (aucun object-cover sur les zones d’examen)', async () => {
    for (const { fichier, zone } of APERÇUS_CONTAIN) {
      const source = await readFile(fichier, 'utf-8');
      const lignesCover = source.split(/\r?\n/).filter((l) => l.includes('object-cover'));
      // Les seuls object-cover restants dans ces fichiers doivent être des
      // zones commerciales identifiées (cartes, vignettes navigation) —
      // jamais les aperçus listés ci-dessus.
      expect(lignesCover.every((l) => !l.includes('alt="Aperçu') && !l.includes('Preview') && !l.includes('alt={product.name}') && !l.includes('alt={item.name}')), `${zone} (${fichier})`).toBe(true);
    }
  });
});
