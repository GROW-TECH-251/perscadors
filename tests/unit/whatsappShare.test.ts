import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { mediaShareExtension } from '@/services/whatsappShareService';

// E6 — Étude natif gratuit : mini-corrections de robustesse sur
// shareMediaToWhatsAppStatus (timeout fetch + extension de fichier correcte)
// et invariants de shareFileWithText (gardes canShare, AbortError distinct).

describe('Unit — E6 mediaShareExtension (helper pur)', () => {
  it('carte MIME → extension : images', () => {
    expect(mediaShareExtension('image/jpeg', 'https://x/y')).toBe('jpg');
    expect(mediaShareExtension('image/png', 'https://x/y')).toBe('png');
    expect(mediaShareExtension('image/webp', 'https://x/y')).toBe('webp');
    expect(mediaShareExtension('image/heic', 'https://x/y')).toBe('heic');
    expect(mediaShareExtension('image/heif', 'https://x/y')).toBe('heif');
  });

  it('carte MIME → extension : vidéos', () => {
    expect(mediaShareExtension('video/mp4', 'https://x/y')).toBe('mp4');
    expect(mediaShareExtension('video/webm', 'https://x/y')).toBe('webm');
    expect(mediaShareExtension('video/quicktime', 'https://x/y')).toBe('mov');
  });

  it('type inconnu → repli sur l’extension de l’URL, puis jpg', () => {
    expect(mediaShareExtension('application/octet-stream', 'https://x/photo.webp?v=2')).toBe('webp');
    expect(mediaShareExtension('image/gif', 'https://x/anim.gif')).toBe('gif');
    expect(mediaShareExtension('', 'https://x/sans-extension')).toBe('jpg');
    expect(mediaShareExtension('image/gif', 'https://x/a.jpeg')).toBe('jpeg');
  });

  it('cas insensible à la casse et paramètres de type ignorés', () => {
    expect(mediaShareExtension('IMAGE/WEBP', 'https://x/y')).toBe('webp');
    expect(mediaShareExtension('image/webp; charset=binary', 'https://x/y')).toBe('webp');
  });
});

describe('Unit — E6 gardes whatsappShareService', () => {
  it('shareMediaToWhatsAppStatus : fetch AVEC timeout (abort 12 s) et helper utilisé', async () => {
    const src = await readFile('src/services/whatsappShareService.ts', 'utf-8');
    expect(src).toContain('const abort = new AbortController()');
    expect(src).toContain('abort.abort(), 12_000');
    expect(src).toContain('fetch(url, { signal: abort.signal })');
    expect(src).toContain('const extension = mediaShareExtension(blob.type, url)');
    // l'ancienne dérivation naïve a disparu
    expect(src).not.toMatch(/blob\.type\.startsWith\('video\/'\) \? 'mp4'/);
  });

  it('shareFileWithText : gardes strictes et AbortError distincts (invariants conservés)', async () => {
    const src = await readFile('src/services/whatsappShareService.ts', 'utf-8');
    const fn = src.slice(src.indexOf('export async function shareFileWithText'));
    expect(fn).toContain("navigator.canShare?.({ files: [file] })");
    expect(fn).toContain("reason: 'unsupported'");
    expect(fn).toContain("reason: 'aborted'");
    expect(fn).toContain("reason: 'failed'");
    expect(fn).toContain('navigator.share({ files: [file], text })');
  });
});
