import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';

// Lot 5 (mission HP Look 09/2026) — harmonisation des champs du formulaire HPB.
// Contexte : la palette du projet est CLAIRE (brand-bg #F5F0E8, brand-text
// #0A0A0A). Quatre champs du formulaire HP Look utilisaient un fond codé en
// dur quasi noir (bg-[#0F0F0F]) AVEC text-brand-text (quasi noir) : texte
// noir sur fond noir, illisible. Correction : fonds et états alignés sur la
// référence AdminInput (bg-brand-bg, bordure brand-gold/20, focus ring or).
// Les surfaces volontairement sombres du chrome admin (sidebar, tooltips,
// badges) ne sont PAS touchées (décision P5 : ne pas imposer de fond clair
// là où le design l'exige).
// Décision validée par l'utilisateur : flèches natives masquées sur les
// champs numériques du formulaire HP Look uniquement (saisie directe et
// type="number" conservés, inputMode="numeric" pour le clavier mobile).

describe('Unit — Lot 5 : champs du formulaire HPB lisibles et harmonisés', () => {
  it('plus aucun fond sombre codé en dur dans les champs (bg-[#0F0F0F] = 0)', async () => {
    const page = await readFile('src/app/admin/hpb/page.tsx', 'utf-8');
    expect(page).not.toContain('bg-[#0F0F0F]');
    // labels : token de palette au lieu de la valeur codée
    expect(page).not.toContain('text-[#888880]');
  });

  it('les champs utilisent la palette standard : bg-brand-bg + bordure or + focus ring (référence AdminInput)', async () => {
    const page = await readFile('src/app/admin/hpb/page.tsx', 'utf-8');
    // 4 champs harmonisés (forfait, libellé ligne, montant ligne, position)
    expect(page.match(/bg-brand-bg px-4 py-3 text-sm text-brand-text/g)?.length).toBeGreaterThanOrEqual(2);
    expect(page.match(/bg-brand-bg px-3 py-2 text-sm text-brand-text/g)?.length).toBeGreaterThanOrEqual(2);
    // états focus alignés sur AdminInput (ring or)
    expect(page.match(/focus:ring-2 focus:ring-brand-gold\/30 focus:border-brand-gold/g)?.length).toBe(4);
  });

  it('flèches natives masquées sur les 3 champs numériques + clavier mobile (inputMode)', async () => {
    const page = await readFile('src/app/admin/hpb/page.tsx', 'utf-8');
    expect(page.match(/hide-number-spinners/g)?.length).toBe(3);
    expect(page.match(/inputMode="numeric"/g)?.length).toBe(3);
    // la saisie numérique reste un vrai type="number" (validation native)
    expect(page.match(/type="number"/g)?.length).toBe(3);
    const css = await readFile('src/app/globals.css', 'utf-8');
    expect(css).toContain('.hide-number-spinners::-webkit-outer-spin-button');
    expect(css).toContain('.hide-number-spinners::-webkit-inner-spin-button');
    expect(css).toMatch(/\.hide-number-spinners\s*\{[^}]*-moz-appearance:\s*textfield/);
  });

  it('non-régression : le chrome admin volontairement sombre est intact', async () => {
    const layout = await readFile('src/app/admin/layout.tsx', 'utf-8');
    expect(layout).toContain('bg-[#0A0A0A]/95');
    const sidebar = await readFile('src/admin/components.tsx', 'utf-8');
    expect(sidebar).toContain('perscadors-desktop-sidebar');
    // la référence du design system (AdminInput) est inchangée
    expect(sidebar).toContain('bg-brand-bg border rounded-xl focus:outline-none focus:ring-2');
  });
});
