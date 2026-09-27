import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// E2 — Vidéo produit injoignable : le lecteur ne doit JAMAIS rester un écran
// noir cassé. onError repasse à la photo principale et masque la tuile ▶ ;
// le comportement des produits sans vidéo reste inchangé.

describe('Unit — E2 fallback vidéo (URL morte)', () => {
  it('le <video> possède un onError qui désactive la vidéo', async () => {
    const src = await readFile('src/app/produit/[id]/product-detail-client.tsx', 'utf-8');
    const start = src.indexOf('<video');

    expect(start).toBeGreaterThan(-1);

    // fenêtre couvrant le tag complet (attributs multi-lignes).

    const video = src.slice(start, start + 900);
    expect(video).toContain('onError');
    expect(video).toContain('setVideoActive(false)');
    expect(video).toContain('setVideoFailed(true)');
  });

  it('la tuile ▶ est masquée une fois la vidéo déclarée morte', async () => {
    const src = await readFile('src/app/produit/[id]/product-detail-client.tsx', 'utf-8');
    expect(src).toContain('{hasVideo && !videoFailed && (');
  });

  it('sans vidéo : aucun lecteur ni tuile (non-régression structure)', async () => {
    const src = await readFile('src/app/produit/[id]/product-detail-client.tsx', 'utf-8');
    expect(src).toContain('videoActive && hasVideo ? (');
    expect(src).toContain('const [videoActive, setVideoActive] = useState(hasVideo);');
  });
});
