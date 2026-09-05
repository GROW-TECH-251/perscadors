import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Consolidation 09/2026 — PARCOURS : recherche sans résultat -> message +
// explication + CTA vers le parcours « Ajouter une photo » EXISTANT
// (aucune deuxième fonctionnalité, §19 ; contexte transmis simplement, §20).
describe('Unit — No-results -> Ajouter une photo', () => {
  it('category-client : CTA visible avec contexte de la recherche (§20)', async () => {
    const source = await readFile('src/app/categorie/[slug]/category-client.tsx', 'utf-8');
    expect(source).toContain('Ajouter une photo');
    expect(source).toContain("href={`/?intro=0&demande=${encodeURIComponent(searchQuery)}#article-request`}");
    expect(source).toContain("Aucun article ne correspond à « {searchQuery} »");
    expect(source).toContain("l'équipe Pescador");
    // CTA tactile : min-h-[52px] (≥44px recommandé) et composant <Link> (ancre réelle).
    expect(source).toContain('min-h-[52px]');
    expect(source).toContain('<Link');
  });

  it('category-client : le cas « filtres sans recherche » garde le message historique', async () => {
    const source = await readFile('src/app/categorie/[slug]/category-client.tsx', 'utf-8');
    expect(source).toContain('Aucun article ne correspond à votre sélection.');
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
