import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { sanitizeMediaSrc } from '@/lib/mediaSecurity';

// Sécurité (CodeQL « DOM text reinterpreted as HTML » / js/xss-through-dom) —
// 5 alertes GitHub corrées : toute URL alimentant un attribut src de <video>
// passe par sanitizeMediaSrc (allowlist de schémas + encodeURI, barrière
// reconnue par l'analyse). Emplacements couverts :
//   - src/components/public/home/Testimonials.tsx (vidéos/images témoignages)
//   - src/components/public/home/Hero.tsx (média hero + setAttribute)
//   - src/app/admin/media/page.tsx (prévisualisation locale + grille admin)
//   - src/components/public/LookModal.tsx (vidéo look, même garde)

describe('Unit — sanitizeMediaSrc (allowlist de schémas)', () => {
  it('accepte et encode les chemins relatifs du site', () => {
    expect(sanitizeMediaSrc('/assets/testimonials/video/client.mp4')).toBe('/assets/testimonials/video/client.mp4');
    // Les espaces (illégales dans une URL) sont encodées, la ressource reste la même.
    expect(sanitizeMediaSrc('/assets/collections/BASKET POUR HOMME/img.jpg')).toBe('/assets/collections/BASKET%20POUR%20HOMME/img.jpg');
  });

  it('accepte les URL absolues http(s) et les blob: (prévisualisation locale)', () => {
    expect(sanitizeMediaSrc('https://res.cloudinary.com/perscadors/video/upload/v1/look.mp4')).toBe('https://res.cloudinary.com/perscadors/video/upload/v1/look.mp4');
    expect(sanitizeMediaSrc('http://localhost:54321/storage/v1/object/public/brand/x.jpg')).toBe('http://localhost:54321/storage/v1/object/public/brand/x.jpg');
    expect(sanitizeMediaSrc('blob:http://localhost:3000/2f7a1c-uuid')).toBe('blob:http://localhost:3000/2f7a1c-uuid');
  });

  it('REFUSE tout autre schéma (data:, javascript:, file:, inconnu)', () => {
    expect(sanitizeMediaSrc('data:text/html,<script>alert(1)</script>')).toBeUndefined();
    expect(sanitizeMediaSrc('data:video/mp4;base64,AAAA')).toBeUndefined();
    expect(sanitizeMediaSrc('javascript:alert(1)')).toBeUndefined();
    expect(sanitizeMediaSrc('file:///etc/passwd')).toBeUndefined();
    expect(sanitizeMediaSrc('vbscript:msgbox')).toBeUndefined();
    // Schéma insensible à la casse (comme les navigateurs) : HTTPS:// reste une URL http(s) valide.
    expect(sanitizeMediaSrc('HTTPS://example.com/x.mp4')).toBe('HTTPS://example.com/x.mp4');
  });

  it('valeurs vides/nulles -> undefined', () => {
    expect(sanitizeMediaSrc(undefined)).toBeUndefined();
    expect(sanitizeMediaSrc(null)).toBeUndefined();
    expect(sanitizeMediaSrc('')).toBeUndefined();
    expect(sanitizeMediaSrc('   ')).toBeUndefined();
  });
});

describe('Unit — gardes sources : chaque src vidéo passe par sanitizeMediaSrc', () => {
  it('Testimonials : entries filtrées, src unique validé', async () => {
    const t = await readFile('src/components/public/home/Testimonials.tsx', 'utf-8');
    expect(t).toContain('const mediaEntries = assets');
    expect(t).toContain('sanitizeMediaSrc(asset.url)');
    expect(t).toContain('src={src}');
    expect(t).not.toContain('src={asset.url}');
  });

  it('Hero : les 3 points d’entrée de mediaUrl sont sanitarisés (setMediaUrl/setAttribute propres)', async () => {
    const h = await readFile('src/components/public/home/Hero.tsx', 'utf-8');
    expect(h.match(/sanitizeMediaSrc\(/g)?.length).toBeGreaterThanOrEqual(3);
    expect(h).not.toContain('setMediaUrl(assetData.url)');
    expect(h).not.toContain('setMediaUrl(mapLegacyHeroVideo');
  });

  it('Médias admin : prévisualisation blob validée + grille sanitarisée', async () => {
    const m = await readFile('src/app/admin/media/page.tsx', 'utf-8');
    expect(m).toContain('setFilePreview(sanitizeMediaSrc(URL.createObjectURL(file)) ?? \'\')');
    expect(m).toContain('src={sanitizeMediaSrc(asset.url)}');
  });

  it('LookModal : vidéo du look passée par la même garde', async () => {
    const l = await readFile('src/components/public/LookModal.tsx', 'utf-8');
    expect(l).toContain('const videoSrc = sanitizeMediaSrc(outfit.video)');
    expect(l).toContain('src={videoSrc}');
    expect(l).not.toContain('src={outfit.video}');
  });
});
