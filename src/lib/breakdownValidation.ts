/**
 * Lot 4 (mission HP Look 09/2026) — validation des montants de la décomposition.
 *
 * Règle réelle de la base (contrainte outfits_price_breakdown_check, IMPL-4),
 * VÉRIFIÉE sur PostgreSQL 17 : seuls les montants ENTIERS positifs passent
 * (la branche décimale de la regex SQL est inopérante — double backslash —
 * et « 12.5 » est rejeté). Cohérent avec le FCFA/XOF, devise sans sous-unité.
 *
 * Le formulaire historique acceptait les décimales et les notations
 * scientifiques : la sauvegarde partait du navigateur puis échouait sur une
 * erreur brute de contrainte SQL. Ce valideur applique la règle de la base
 * AVANT l'envoi, avec un message clair :
 *   - non vide, nombre fini, strictement positif (règle formulaire existante,
 *     plus stricte que la base qui tolère 0) ;
 *   - ENTIER (FCFA) — « 12.5 » et « 1e-7 » sont refusés proprement.
 */
export function isBreakdownAmountValid(raw: string): boolean {
  if (raw.trim() === '') return false;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return false;
  // Miroir du comportement réel de la contrainte SQL : entier en écriture
  // décimale simple (rejecte « 12.5 », « 1e-7 », « 1e+21 »…).
  return /^[0-9]+$/.test(String(value));
}
