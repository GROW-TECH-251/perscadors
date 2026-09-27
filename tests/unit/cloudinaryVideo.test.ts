import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFile } from 'fs/promises';
import { uploadCloudinaryVideo } from '@/services/cloudinaryVideoService';
import { isAllowedMediaFolder } from '@/lib/cloudinary';

// E12-consolidation — upload vidéo : chaque cause d'échec de signature doit
// produire un message distinct et compréhensible (plus de message générique),
// et l'allowlist des dossiers doit couvrir toutes les sections du Dashboard.

function reponse(statut: number, corps: unknown = {}) {
  return new Response(JSON.stringify(corps), { status: statut, headers: { 'Content-Type': 'application/json' } });
}

function fichierVideo(): File {
  return new File(['contenu-video-fictif'], 'presentation.mp4', { type: 'video/mp4' });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('isAllowedMediaFolder (allowlist dossiers vidéo)', () => {
  it('accepte les 4 sections du Dashboard Médias', () => {
    for (const dossier of ['perscadors/hero', 'perscadors/logo', 'perscadors/testimonials', 'perscadors/ambience']) {
      expect(isAllowedMediaFolder(dossier)).toBe(true);
    }
  });

  it('accepte les dossiers produits (id numérique, brouillon, slug)', () => {
    expect(isAllowedMediaFolder('perscadors/products/12')).toBe(true);
    expect(isAllowedMediaFolder('perscadors/products/product-1757952000000')).toBe(true);
    expect(isAllowedMediaFolder('perscadors/products/550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('refuse les dossiers inconnus, vides et les traversals', () => {
    expect(isAllowedMediaFolder('perscadors/reels')).toBe(false);
    expect(isAllowedMediaFolder('perscadors/products/')).toBe(false);
    expect(isAllowedMediaFolder('perscadors/products/12/x')).toBe(false);
    expect(isAllowedMediaFolder('perscadors/products/../..')).toBe(false);
    expect(isAllowedMediaFolder('')).toBe(false);
  });

  it('reste synchronisée avec les sections réellement proposées par /admin/media', async () => {
    const page = await readFile('src/app/admin/media/page.tsx', 'utf-8');
    const ids = [...page.matchAll(/id: '([a-z]+)'/g)].map((match) => match[1]);
    expect(ids.length).toBeGreaterThanOrEqual(4);
    for (const id of ids) {
      expect(isAllowedMediaFolder(`perscadors/${id}`)).toBe(true);
    }
  });
});

describe('uploadCloudinaryVideo — messages différenciés (étape signature)', () => {
  it('403 : session administrateur expirée', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reponse(403, { error: 'Accès non autorisé.' })));
    const resultat = await uploadCloudinaryVideo(fichierVideo(), 'perscadors/products/12');
    expect(resultat.error).toBe('Session administrateur expirée. Reconnectez-vous puis réessayez.');
  });

  it('503 : configuration Cloudinary manquante', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reponse(503, { error: 'Service média indisponible.' })));
    const resultat = await uploadCloudinaryVideo(fichierVideo(), 'perscadors/products/12');
    expect(resultat.error).toBe('Service vidéo non configuré (variables Cloudinary manquantes). Contactez l’administrateur technique.');
  });

  it('400 : le message serveur (destination invalide) est transmis tel quel', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reponse(400, { error: 'Destination média invalide.' })));
    const resultat = await uploadCloudinaryVideo(fichierVideo(), 'perscadors/reels');
    expect(resultat.error).toBe('Destination média invalide.');
  });

  it('429 : le message serveur (trop de demandes) est transmis', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => reponse(429, { error: 'Trop de demandes. Réessayez dans quelques minutes.' })));
    const resultat = await uploadCloudinaryVideo(fichierVideo(), 'perscadors/products/12');
    expect(resultat.error).toBe('Trop de demandes. Réessayez dans quelques minutes.');
  });

  it('corps non JSON : message de préparation conservé', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('<html>', { status: 502 })));
    const resultat = await uploadCloudinaryVideo(fichierVideo(), 'perscadors/products/12');
    expect(resultat.error).toBe('Préparation Cloudinary impossible.');
  });

  it('échec réseau : connexion indisponible', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network down'); }));
    const resultat = await uploadCloudinaryVideo(fichierVideo(), 'perscadors/products/12');
    expect(resultat.error).toBe('Connexion Cloudinary indisponible.');
  });
});
