// E4 — Les emojis ne décrivent aucun article du catalogue : ils sont retirés
// de la normalisation, des DEUX côtés (requête ET attributs) pour rester
// cohérent. « basket 🔥 » trouve les baskets ; « 🔥 » seul devient une
// requête vide — les appelants gardent contre toute navigation à vide.
// Extended_Pictographic couvre les pictogrammes, symboles et dingbats ;
// FE0F (sélecteur de variation) et 200D (liaison ZWJ) complètent le retrait.
const EMOJI_PATTERN = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu;

export function normalizeProductAttribute(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(EMOJI_PATTERN, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('fr-FR');
}

export function normalizeSize(value: string): string {
  return normalizeProductAttribute(value).toUpperCase();
}
