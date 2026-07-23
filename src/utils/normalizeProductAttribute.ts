export function normalizeProductAttribute(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('fr-FR');
}

export function normalizeSize(value: string): string {
  return normalizeProductAttribute(value).toUpperCase();
}
