import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Garde-fous DERNIERE PASSE DE FINALISATION (pre-livraison, meet vendredi) :
// 1. STOCK : miniature produit (image existante) + fallback discret ;
// 2. WHATSAPP : message commande via buildWhatsAppUrl (NFC + coupe sure +
//    numero Reglages), photo de chaque article dans le message, presse-papier
//    en secours de la caption Android, aucun emoji a variation selector ;
// 3. HP LOOKS : convergence mesuree depuis le logo reel (IntroStage).
describe('Unit — Finalisation : stock, whatsapp, hp looks', () => {
  it('STOCK : chaque carte porte une miniature next/image avec fallback discret', async () => {
    const page = await readFile('src/app/admin/stock/page.tsx', 'utf-8');
    expect(page).toContain("import Image from 'next/image'");
    expect(page).toContain('product.image_url || product.images?.[0]');
    expect(page).toContain('sizes="96px"');
    expect(page).toContain('Aperçu produit indisponible');
    // Jamais de nouvelle source de media : uniquement les champs existants.
    expect(page).not.toContain('fetch(');
  });

  it('WHATSAPP commande : buildWhatsAppUrl (normalisation) + numero des Reglages', async () => {
    const step = await readFile('src/components/checkout/StepConfirm.tsx', 'utf-8');
    expect(step).toContain("import { buildWhatsAppUrl } from '@/services/whatsappService'");
    expect(step).toContain('buildWhatsAppUrl(message, shopSettings?.whatsapp_phone)');
    expect(step).not.toContain('wa.me/');
    expect(step).not.toContain('encodeURIComponent(message)');
    expect(step).not.toContain('WHATSAPP_DIGITS =');
  });

  it('WHATSAPP commande : la photo publique de chaque article est dans le message', async () => {
    const svc = await readFile('src/services/orderService.ts', 'utf-8');
    expect(svc).toContain('const photo = (item as { image?: string | null }).image?.trim();');
    expect(svc).toContain('Photo : ${photo}');
  });

  it('WHATSAPP ajouter-une-photo : texte copie au presse-papier avant le partage natif (caption Android perdue)', async () => {
    const section = await readFile('src/components/public/home/ArticleRequestSection.tsx', 'utf-8');
    expect(section).toContain('navigator.clipboard?.writeText(lines.join');
    expect(section).toContain('collez-le si WhatsApp');
    // Le texte complet reste construit AVANT tout partage (types/ref/couleur/taille/budget).
    expect(section).toContain("Taille : ${articleForm.size || 'Non précisé'}");
    expect(section).toContain("Budget : ${articleForm.budget || 'Non précisé'} FCFA");
  });

  it('EMOJIS : aucun caractere a variation selector (U+FE0F) ni emoji U+1F6CD dans les messages du site', async () => {
    const files = [
      'src/services/whatsappService.ts',
      'src/services/orderService.ts',
      'src/services/settingsService.ts',
      'src/components/public/home/ArticleRequestSection.tsx',
      'src/app/admin/clients/page.tsx',
      'src/app/admin/hpb/page.tsx',
      'src/app/admin/produits/page.tsx',
      'src/app/admin/contenu/page.tsx'
    ];
    for (const file of files) {
      const source = await readFile(file, 'utf-8');
      expect(source.includes('\uFE0F'), `${file} contient U+FE0F`).toBe(false);
      expect(source.includes('\u{1F6CD}'), `${file} contient U+1F6CD`).toBe(false);
    }
  });

  it('HP LOOKS : la convergence mesure le centre reel du logo (resize inclus, jamais dans la boucle)', async () => {
    const stage = await readFile('src/components/public/intro/IntroStage.tsx', 'utf-8');
    expect(stage).toContain('measureLogoOffset');
    expect(stage).toContain('convergeTarget(seed, width, height, logoOffset)');
    expect(stage).toContain('measureLogoOffset();');
    // La mesure vit dans refreshBox (au resize), pas dans la boucle rAF.
    const refreshIdx = stage.indexOf('const refreshBox = () => {');
    const measureIdx = stage.indexOf('measureLogoOffset();', refreshIdx);
    expect(refreshIdx).toBeGreaterThan(-1);
    expect(measureIdx).toBeGreaterThan(refreshIdx);
  });
});
