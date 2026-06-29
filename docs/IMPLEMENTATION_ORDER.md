# IMPLEMENTATION ORDER — ORDRE STRATÉGIQUE DE L'IMPLÉMENTATION

## PLAN D'EXÉCUTION DU SYSTÈME UNIVERSEL DE MÉDIAS DYNAMIQUES
Ce document liste l'ordre chronologique strict suivi par le Lead Architect pour déployer le **Universal Admin Media System** sur le dépôt Perscadors.

### 1. DÉPENDANCES ET PRÉREQUIS
L'environnement Next.js 16.2.6 (Turbopack) et React 19.2.4 embarque nativement l'intégralité de l'outillage de production :
- `lucide-react` (pour l'icône `Film` et l'ergonomie mobile).
- `@supabase/supabase-js` (pour les clients de Storage et Auth).
- `next/font` et `tailwindcss`.

```bash
# Vérification et installation des paquets de production
npm install --legacy-peer-deps
```

### 2. ORDRE CHRONOLOGIQUE DES MODIFICATIONS
Le déploiement suit une logique d'imbrication ascendante (du type brut au rendu UI) :

1. **`src/admin/types.ts` :**
   - Import et déclaration de la route `'media'` dans `AdminScreen`.
   - Ajout des types `SiteAssetType`, `SiteAssetSection` et de l'interface complète `SiteAsset`.
2. **`src/services/mediaService.ts` :**
   - Élargissement des BUCKETS avec `SITE_ASSETS: 'site-assets'`.
   - Déclaration du catalogue par défaut `DEFAULT_SITE_ASSETS` (8 mock-ups couvrant la vidéo d'accueil, le logo, les 3 témoignages clients et les embeds sociaux).
   - Implémentation des fonctions CRUD Supabase couplées au fallback `localStorage` (`__PERSCADORS_SITE_ASSETS_CACHE__`).
3. **`src/app/admin/layout.tsx` :**
   - Mapping de l'URL `/admin/media` vers le nom d'écran `'media'`.
   - Paramétrage de la redirection sécurisée `PATH_MAP`.
4. **`src/admin/components.tsx` :**
   - Injection de l'onglet `Gestion Médias` dans `ADMIN_NAV_ITEMS`.
   - Déclaration de l'icône `<Film size={20} />` dans `iconMap`.
5. **`src/app/admin/media/page.tsx` (Création pure) :**
   - Dashboard universel de pilotage des 10 zones de médias (`hero`, `logo`, `testimonials`, `ambience`, `tiktok`, `reels`, `sections`, `thumbnails`, `backgrounds`, `galleries`).
   - Saisie flexible (acceptant librement image ou vidéo) et hybride (fichiers locaux ou URLs directes TikTok/Instagram).
   - Indicateurs d'état en ligne/inactif, Toast en verre dépoli et purge des boîtes de messages SQL.
6. **Raccordement Dynamique de la Vitrine Publique :**
   - **`src/components/home/Hero.tsx` :** Binding de `fetchActiveAssetBySection('hero')` gérant la permutation fluide entre lecteur vidéo MP4 et bannière image.
   - **`src/components/layout/Navbar.tsx` & `src/components/layout/Footer.tsx` :** Binding de `fetchActiveAssetBySection('logo')`.
   - **`src/components/home/Testimonials.tsx` :** Binding de `fetchActiveAssetsBySection('testimonials')` et `fetchActiveAssetsBySection('tiktok')`.

### 3. COMMANDES TERMINAL DE VÉRIFICATION
Une fois l'implémentation physique accomplie, la validation de la branche est effectuée par la séquence suivante :

```bash
# 1. Vérification de la propreté du typage TypeScript (Zéro erreur)
npx tsc --noEmit

# 2. Vérification des règles ESLint (Respect strict de react-hooks/set-state-in-effect)
npm run lint

# 3. Validation du build de production Next.js Turbopack (Optimisation des routes ƒ)
npm run build
```

### 4. VÉRIFICATIONS FINALES DU CLIENT (QA)
- Lancement de `npm run dev`.
- Constat de la disparition totale des 18 issues de clés Turbopack, de l'erreur `Hydration failed` et de l'alerte `validateDOMNesting`.
- Upload d'un média test sur `/admin/media` et vérification de la bascule en temps réel sur la vitrine publique sans aucun redéploiement.

---
**Le plan d'implémentation est achevé.** La plateforme est un modèle de stabilité et de scalabilité.
