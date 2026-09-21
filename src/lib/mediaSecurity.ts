/**
 * IMPL sécurité (CodeQL « DOM text reinterpreted as HTML » / js/xss-through-dom)
 * — validation des URL médias rendues côté client dans les attributs src.
 *
 * Contexte : les URL affichées (vidéos notamment) proviennent des fichiers du
 * site (chemins relatifs), du stockage/CDN (http/https) ou d'une prévisualisation
 * locale (blob:, URL.createObjectURL). On n'accepte QUE ces formes : tout autre
 * schéma (data:, javascript:, file:, …) est refusé et ne atteint jamais le DOM.
 *
 * Le retour passe par `encodeURI` : caractères illégaux d'une URL encodés au
 * passage, et barrière reconnue par l'analyse CodeQL (UriEncodingSanitizer).
 */

export function sanitizeMediaSrc(raw: string | null | undefined): string | undefined {
  if (!raw) return undefined;
  const value = raw.trim();
  if (!value) return undefined;
  // Chemin relatif du site (assets publics, routes internes).
  if (value.startsWith('/')) return encodeURI(value);
  // Prévisualisation locale d'un fichier sélectionné (blob:).
  if (/^blob:/i.test(value)) return encodeURI(value);
  // URL absolue http(s) uniquement (stockage Supabase, CDN Cloudinary…).
  if (/^https?:\/\//i.test(value)) return encodeURI(value);
  // Tout le reste (data:, javascript:, file:, schémas inconnus…) : refusé.
  return undefined;
}
