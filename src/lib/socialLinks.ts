// src/lib/socialLinks.ts
// ============================================
// MISSION SEO (07/11/2026) — présence numérique officielle de Perscadors.
//
// Hiérarchie d'identité (confirmée par la direction, 07/11) :
//   Perscadors ................ nom commercial
//   HP Collection ............. nom de la collection
//   Honoré Perscadors ......... propriétaire (fondateur)
//   Honoré Perscadors Collection : désignation développée communiquée
//   Vioutou ................... surnom du propriétaire
// Ne jamais utiliser les anciennes transcriptions erronées
// (« Conary Pescador », « Conori Pescador »).
//
// Vérifications effectuées le 07/11/2026 :
//   - TikTok @perscadors : HTTP 200 — profil public accessible.
//   - Google Maps : lien fourni résolu vers la fiche publique « HP Collection »
//     (pin 6.3787294, 2.4957811 — Haie Vive / Centre Ville, Cotonou).
//   - Facebook : le lien fourni (facebook.com/share/1FA7Ybh1ku/) est un lien
//     de PARTAGE, non résolvable en URL permanente depuis l'environnement
//     d'audit (HTTP 400/403). Il reste VIDE ici tant que l'URL canonique du
//     profil/page officiel n'a pas été confirmée — aucun lien non vérifié ne
//     doit être publié (ni footer, ni sameAs).

/** Profil TikTok officiel (vérifié). */
export const TIKTOK_URL = 'https://www.tiktok.com/@perscadors';

/** Fiche Google Maps officielle « HP Collection » (vérifiée). */
export const GOOGLE_MAPS_URL =
  'https://www.google.com/maps/place/HP+Collection/@6.3787347,2.4932062,17z/data=!3m1!4b1!4m6!3m5!1s0x103cabb3de5627b9:0xc9e54cae9cd4cf6!8m2!3d6.3787294!4d2.4957811!16s%2Fg%2F11ntnr9ytg';

/** Lien court fourni par la direction (redirige vers la fiche) — usage footer. */
export const GOOGLE_MAPS_SHORT_URL = 'https://maps.app.goo.gl/cHm8rbZMVKdtiLwT9';

/** Coordonnées du pin de la fiche Google Maps officielle (pas des coordonnées déduites). */
export const STORE_GEO = { latitude: 6.3787294, longitude: 2.4957811 } as const;

/**
 * URL permanente Facebook — À RENSEIGNER après confirmation (guide
 * GUIDE-FACEBOOK.md, § « retrouver l'URL publique permanente »). Reste vide
 * tant qu'elle n'est pas vérifiée : le footer et le sameAs l'ignorent.
 */
export const FACEBOOK_URL = '';
