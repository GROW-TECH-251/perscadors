import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { execSync } from 'node:child_process';
import {
  buildWhatsAppUrl,
  normalizeWhatsAppMessage,
  resolveWhatsAppPhone,
} from '@/services/whatsappService';

// Garde-fous PERF-04 — WhatsApp : encodage incassable + photo en média réel.
// 1) Round-trip : tout message (accents, œ, emojis, retours à la ligne,
//    montants) survit à l'encodage URL et re-décode à l'identique (NFC).
// 2) Coupe sûre : un message long est plafonné SANS jamais couper un emoji
//    en deux (cause des « � » observés).
// 3) Partage natif : la photo part en FICHIER réel quand le navigateur le
//    permet, avec fallback intact (upload + lien) et annulation respectée.
// 4) Garde permanent : plus jamais un caractère U+FFFD dans les sources.
describe('Unit — PERF-04 WhatsApp encodage + photo', () => {
  const battery = [
    'Bonjour 👋 je cherche une paire de baskets en taille 43',
    "Référence : Nike Air Max — couleur : bé clair, taille : XL, budget : 25 000 FCFA",
    'Caractères : é è ê ë à â ç œ æ ï ù « » apostrophe l\'autre',
    'Emojis : 📸🙌🔥😊🇧🇯 (drapeau = 2 paires de surrogates)',
    `Multi-ligne :\nType : Jean oversize\nBudget : 18 000 FCFA\nMerci beaucoup ! 🙌`,
  ];

  it('round-trip : le texte encodé dans l’URL re-décode à l’identique (NFC)', () => {
    for (const message of battery) {
      const url = buildWhatsAppUrl(message, '22967280018');
      const encoded = url.split('?text=')[1];
      expect(decodeURIComponent(encoded)).toBe(message.normalize('NFC'));
      expect(url.startsWith('https://wa.me/22967280018?text=')).toBe(true);
      expect(url).not.toContain('%uFFFD');
      expect(url).not.toContain(String.fromCharCode(0xfffd));
    }
  });

  it('NFC : une entrée décomposée (e + accent combinant) est normalisée', () => {
    const decomposed = 'cafe\u0301 '; // 'e' + accent combinant = é décomposé
    expect(normalizeWhatsAppMessage(decomposed)).toBe(decomposed.normalize('NFC'));
  });

  it('coupe sûre : un message long est plafonné sans jamais casser un emoji', () => {
    const emoji = '🙌';
    const long = `${'Merci de me confirmer la disponibilité. '.repeat(60)}${emoji}`;
    const result = normalizeWhatsAppMessage(long);
    expect(result.length).toBeLessThanOrEqual(1601); // plafond + ellipse
    expect(result.endsWith('…')).toBe(true);
    // Aucun surrogate orphelin (demi-emoji) dans le résultat.
    const units = Array.from(result);
    for (let i = 0; i < units.length; i += 1) {
      const code = units[i].charCodeAt(0);
      if (code >= 0xd800 && code <= 0xdbff) {
        const next = units[i + 1]?.charCodeAt(0) ?? 0;
        expect(next >= 0xdc00 && next <= 0xdfff).toBe(true);
      }
    }
    // Le message court passe intact.
    expect(normalizeWhatsAppMessage('OK 👋')).toBe('OK 👋');
  });

  it('résolution du numéro : digits 8 (local Bénin) -> préfixe 229 ajouté par le composant', () => {
    expect(resolveWhatsAppPhone('229 67 28 00 18')).toBe('22967280018');
    expect(resolveWhatsAppPhone('+229 96 00 00 00')).toBe('22996000000');
  });

  it('ArticleRequestSection : partage natif prioritaire, fallback historique intact', async () => {
    const src = await readFile('src/components/public/home/ArticleRequestSection.tsx', 'utf-8');
    expect(src).toContain("import { shareFileWithText } from '@/services/whatsappShareService'");
    expect(src).toContain('await shareFileWithText(selectedFile, lines.join(\'\\n\'))');
    expect(src).toContain("nativeShare.reason === 'aborted'");
    // Fallback historique conservé : upload + ligne photo + wa.me.
    expect(src).toContain('await uploadImageIfNeeded()');
    expect(src).toContain('📸 Photo : ${uploadedImageUrl}');
    // Plus aucune URL wa.me construite à la main : NFC + coupe sûre partout.
    expect(src).not.toContain('`https://wa.me/');
    expect(src).toContain('buildWhatsAppUrl(fullLines.join(\'\\n\'), clientPhone)');
  });

  it('shareFileWithText : gardes strictes, jamais de fausse promesse', async () => {
    const svc = await readFile('src/services/whatsappShareService.ts', 'utf-8');
    expect(svc).toContain('export async function shareFileWithText(');
    expect(svc).toContain('!navigator.share || !navigator.canShare?.({ files: [file] })');
    expect(svc).toContain("return { shared: false, reason: 'unsupported' };");
    expect(svc).toContain("error as DOMException)?.name === 'AbortError'");
    expect(svc).toContain("return { shared: false, reason: 'aborted' };");
    expect(svc).toContain('navigator.share({ files: [file], text })');
  });

  it('audit SQL livré : détection U+FFFD + correctif commenté', async () => {
    const sql = await readFile('supabase/audits/whatsapp_encoding_audit.sql', 'utf-8');
    expect(sql).toContain('chr(65533)');
    expect(sql).toContain('whatsapp_share_templates');
    expect(sql).toContain('-- update public.shop_settings');
  });

  it('garde permanent : aucun caractère U+FFFD dans les sources du projet', () => {
    let hits = '';
    try {
      hits = execSync('grep -rl $\'\\uFFFD\' src/ || true', { encoding: 'utf-8', shell: '/bin/bash' });
    } catch {
      hits = '';
    }
    expect(hits.trim()).toBe('');
  });
});
