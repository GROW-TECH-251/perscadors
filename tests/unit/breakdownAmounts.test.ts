import { describe, it, expect } from 'vitest';
import { readFile } from 'fs/promises';
import { isBreakdownAmountValid } from '@/lib/breakdownValidation';

// Lot 4 (mission HP Look 09/2026) — montants de la décomposition.
// Règle réelle de la base VÉRIFIÉE sur PostgreSQL 17 (contrainte
// outfits_price_breakdown_check de la migration IMPL-4) : entiers positifs
// uniquement — « 12.5 » est REJETÉ (la branche décimale de la regex SQL est
// inopérante, double backslash dans le fichier), « 1e-7 » rejeté, « 0 »
// accepté par la base mais le formulaire est plus strict (> 0, règle
// existante). Le FCFA/XOF n'a pas de sous-unité : entier = la règle métier.
// Le validateur du formulaire doit refuser AVANT l'envoi tout ce que la base
// rejetterait (l'ancien comportement laissait passer « 12.5 » et produisait
// une erreur brute de contrainte SQL à la sauvegarde).

// Batterie établie d'après le comportement réel constaté sur PostgreSQL 17 :
// [saisie, accepté par le validateur ?]
const BATTERIE: Array<[string, boolean]> = [
  ['37', true],              // entier positif (cas réel : look #25)
  ['15000', true],           // entier positif
  ['1e3', true],             // normalisé en 1000 par Number() -> entier sérialisé « 1000 »
  ['999999999999', true],    // grand entier, écriture simple
  ['12.5', false],           // décimal : REJETÉ par la base (vérifié PG 17) — FCFA entier
  ['0.000001', false],       // décimal : rejeté
  ['0', false],              // la base l'accepte, le formulaire est plus strict (> 0)
  ['-5', false],             // négatif : rejeté
  ['', false],               // vide
  ['   ', false],            // espaces
  ['abc', false],            // non numérique
  ['12,5', false],           // virgule française : non numérique -> message clair
  ['0.0000001', false],      // sérialisé « 1e-7 » : rejeté par la base
  ['1e21', false],           // sérialisé « 1e+21 » : rejeté par la base
];

describe('Unit — Lot 4 : validateur des montants (miroir de la contrainte SQL réelle)', () => {
  it('accepte/rejette exactement ce que la base accepte/rejette (batterie PG 17)', () => {
    for (const [saisie, attendu] of BATTERIE) {
      expect(isBreakdownAmountValid(saisie), `saisie=${JSON.stringify(saisie)}`).toBe(attendu);
    }
  });

  it('plus jamais d erreur brute : « 12.5 » (accepté avant le Lot 4) est refusé proprement', () => {
    // Régression du bug pré-existant : le formulaire laissait passer la
    // décimale, la base la rejetait -> erreur SQL brute à la sauvegarde.
    expect(isBreakdownAmountValid('12.5')).toBe(false);
    expect(isBreakdownAmountValid('37')).toBe(true);
  });
});

describe('Unit — Lot 4 : gardes sources (formulaire HPB)', () => {
  it('la validation de sauvegarde utilise le validateur (plus de Number() nu)', async () => {
    const page = await readFile('src/app/admin/hpb/page.tsx', 'utf-8');
    expect(page).toContain('isBreakdownAmountValid(line.amount)');
    expect(page).not.toContain("filledLines.some((line) => line.label.trim() === '' || line.amount.trim() === '' || !Number.isFinite(Number(line.amount)) || Number(line.amount) <= 0)");
    expect(page).toContain('entier positif en FCFA');
  });

  it('règles voisines inchangées : forfait > 0, somme indicative recalculée, saisie directe conservée', async () => {
    const page = await readFile('src/app/admin/hpb/page.tsx', 'utf-8');
    // forfait : validation existante préservée
    expect(page).toContain("'Prix forfaitaire invalide : indique un nombre supérieur à 0.'");
    // total : somme indicative recalculée à chaque frappe (useMemo sur priceLines)
    expect(page).toContain('Number.isFinite(Number(line.amount)) ? Number(line.amount) : 0');
    // saisie directe : champs numériques avec boutons natifs conservés
    expect(page.match(/type="number"/g)?.length).toBeGreaterThanOrEqual(2);
    // chargement d'une décomposition existante : montant restitué en texte
    expect(page).toContain("line && line.amount != null ? String(line.amount) : ''");
  });
});
