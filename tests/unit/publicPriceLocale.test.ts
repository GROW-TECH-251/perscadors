import { describe, it, expect } from 'vitest';
import { readFile, readdir } from 'fs/promises';
import { join } from 'path';

// Lot 1 (mission HP Look 09/2026) — stabilité d'hydratation des prix publics.
// Contexte : erreur React #418 constatée en production (HTML serveur ≠ premier
// rendu client). Cause typique : `.toLocaleString()` SANS locale — le serveur
// Node (en-US : « 15,000 ») formate différemment du navigateur fr (« 15 000 »)
// → mismatch de texte → React rejette l'hydratation et re-rend côté client,
// ce qui casse l'interactivité (clic des HP Looks sans effet).
// Règle : tout formatage de prix du périmètre PUBLIC utilise la locale
// explicite 'fr-FR' (convention déjà utilisée par analytics/admin/commandes).

const PUBLIC_FILES = [
  'src/app/categorie/[slug]/category-client.tsx',
  'src/app/looks/hp-looks-client.tsx',
  'src/app/produit/[id]/product-detail-client.tsx',
  'src/components/public/LookModal.tsx',
  'src/components/public/home/CuratedCollections.tsx',
  'src/components/checkout/StepConfirm.tsx',
  'src/components/checkout/StepRecap.tsx',
  'src/services/orderService.ts',
  'src/services/whatsappService.ts',
];

async function publicSources(): Promise<string[]> {
  const sources = [...PUBLIC_FILES];
  for (const dir of ['src/components/public', 'src/components/checkout']) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      if (entry.isFile() && /\.(tsx|ts)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
        sources.push(join(dir, entry.name));
      }
    }
  }
  return sources;
}

describe('Unit — Lot 1 : locale explicite des prix publics (anti #418)', () => {
  it('aucun .toLocaleString() nu dans le périmètre public (SSR et services)', async () => {
    const offenders: string[] = [];
    for (const file of await publicSources()) {
      const source = await readFile(file, 'utf-8');
      if (source.includes('.toLocaleString()')) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it('les prix des pages SSR utilisent la locale explicite fr-FR', async () => {
    for (const file of PUBLIC_FILES.slice(0, 7)) {
      const source = await readFile(file, 'utf-8');
      expect(source, file).toContain(".toLocaleString('fr-FR')");
    }
  });

  it('les montants formatés par les services de commande sont aussi en fr-FR', async () => {
    for (const file of ['src/services/orderService.ts', 'src/services/whatsappService.ts']) {
      const source = await readFile(file, 'utf-8');
      expect(source, file).toContain(".toLocaleString('fr-FR')");
      expect(source, file).not.toContain('.toLocaleString()');
    }
  });
});
