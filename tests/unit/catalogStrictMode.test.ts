import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// E2 — Course StrictMode (double montage dev) dans CatalogProvider : le run
// annulé passait isInitialLoad à false, ce qui déclenchait le cleanup du
// second run avant son réveil : le catalogue client n'était JAMAIS fetché
// quand le snapshot serveur était en fallback (« ARTICLE INTROUVABLE »
// injustifié, specs E2E vidéo systématiquement skipped). Garde : seule
// l'injection d'un snapshot clôt le chargement ; un run annulé laisse la
// relance retenter.

describe('Unit — E2 CatalogProvider : la relance doit pouvoir retenter le fetch', () => {
  it("l'ancienne course (annulé => clôture) a disparu", async () => {
    const src = await readFile('src/context/CatalogContext.tsx', 'utf-8');
    expect(src).not.toContain('if (cancelled || injectedCatalogSnapshot) {');
    expect(src).not.toMatch(/if \(cancelled[^)]*\) \{[\s\S]{0,80}setIsInitialLoad\(false\)/);
  });

  it('annulé = sortie simple sans clôture ; le fetch reste présent', async () => {
    const src = await readFile('src/context/CatalogContext.tsx', 'utf-8');
    expect(src).toContain('if (cancelled) return;');
    expect(src).toContain('await loadCatalog();');
  });
});
