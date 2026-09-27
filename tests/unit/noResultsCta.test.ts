import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Consolidation 09/2026 — PARCOURS : recherche sans résultat -> message +
// explication + CTA vers le parcours « Ajouter une photo » EXISTANT
// (aucune deuxième fonctionnalité, §19 ; contexte transmis simplement, §20).
describe('Unit — No-results -> Ajouter une photo', () => {
  it('category-client : CTA visible avec contexte de la recherche (§20, inline depuis E5)', async () => {
    const source = await readFile('src/app/categorie/[slug]/category-client.tsx', 'utf-8');
    // E5 (Riel) : le CTA vit désormais INLINE via ArticleRequestSection compact
    // (plus de redirection vers la home ?demande=) — la recherche en échec est
    // transmise au composant qui préremplit la référence de la modale.
    expect(source).toContain('<ArticleRequestSection variant="compact" searchQuery={searchQuery || undefined}');
    expect(source).toContain('Complète le look');
    expect(source).not.toContain('?demande=');
  });

  it('category-client : le cas « filtres sans recherche » garde une issue (compact sans requête)', async () => {
    const source = await readFile('src/app/categorie/[slug]/category-client.tsx', 'utf-8');
    // E5 : sans recherche, le compact affiche « Vous ne trouvez pas ce que vous
    // cherchez ? » + les deux issues (photo / toute la collection).
    expect(source).toContain('variant="compact"');
  });

  it('ArticleRequestSection : la modale existante s’ouvre avec la recherche en référence', async () => {
    const source = await readFile('src/components/public/home/ArticleRequestSection.tsx', 'utf-8');
    expect(source).toContain("params.get('demande')");
    expect(source).toContain("setShowArticleForm(true)");
    expect(source).toContain("reference: demande.trim().slice(0, 120)");
    // Paramètre consommé : pas de ré-ouverture au retour sur la home.
    expect(source).toContain('history.replaceState');
    // Le formulaire reste l'unique parcours (aucun duplicata).
    expect(source).toContain('type ArticleFormState = typeof EMPTY_ARTICLE_FORM');
  });

  it('ancre #article-request : existe sur la section (cible du CTA)', async () => {
    const source = await readFile('src/components/public/home/ArticleRequestSection.tsx', 'utf-8');
    expect(source).toContain('<section id="article-request"');
  });
});
