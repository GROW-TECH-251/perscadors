# SEO SETUP — CONFIGURATION DE L'ARCHITECTURE DE VISIBILITÉ

## STRATÉGIE DE DÉCOUVRABILITÉ ORGANIQUE NEXT.JS 16.2
Ce document détaille l'architecture SEO technique avancée implémentée pour la plateforme e-commerce premium **Perscadors / HP Collection** de Vioutou.

### 1. MÉTADONNÉES GLOBALES ET OPEN GRAPH (`src/app/layout.tsx`)
L'application Next.js exploite la nouvelle API `Metadata` pour garantir un référencement optimal sur l'ensemble des moteurs de recherche et plateformes de messagerie :
- **`metadataBase` :** Renseigné sur `https://perscadors.vercel.app` pour permettre aux robots la résolution native des URLs d'images relatives.
- **Modèle de Titre (`template`) :** Déclaration de `template: '%s | HP Collection Cotonou'` pour normaliser l'affichage des titres de fiches produits et de catégories.
- **Open Graph et Twitter Cards :** Déclaration explicite de l'image de couverture globale (`IMG-20251014-WA0036.jpg`), du titre et de la description pour assurer un affichage premium dans les aperçus WhatsApp et Facebook.
- **Mots-clés pertinents :** Injection des lexiques stratégiques : `streetwear`, `mode`, `bénin`, `vioutou`, `baskets`, `complets`, `jean oversize`, `cotonou`, `vêtements premium`.

### 2. EXPLORATION DES ROBOTS ET SITEMAP (`src/app/robots.ts` & `src/app/sitemap.ts`)
Pour guider efficacement Googlebot :
- **Fichier `robots.ts` :** Autorisation propre de l'arborescence publique (`/`, `/categorie/`, `/looks`, `/produit/`) et blocage strict du back-office (`/admin`, `/admin/`) pour préserver le budget de crawl (Crawl Budget).
- **Générateur `sitemap.ts` (Dynamic Sitemap) :** Script asynchrone générant en temps réel le fichier `sitemap.xml` en parcourant dynamiquement les catégories, les fiches des 19 articles premium et les 32 HP Looks avec une pondération de priorité (`priority: 1.0` pour l'accueil, `0.9` pour les Looks, `0.7` pour les produits).

### 3. DONNÉES STRUCTURÉES JSON-LD (`schema.org`)
Chaque page publique injecte un balisage sémantique JSON-LD dans le code HTML pour alimenter le graphe de connaissances Google (Knowledge Graph) et valider les Rich Snippets :
- **`Store` / `WebSite` (`page.tsx`) :** Informations locales (Cotonou, Bénin), contact WhatsApp direct (`+22967280018`), horaires d'ouverture et devises acceptées (`XOF`).
- **`Product` (`produit/[id]/page.tsx`) :** Fiche produit normée avec l'accordéon `offers` (disponibilité en stock, prix en FCFA).
- **`CollectionPage` (`categorie/[slug]/page.tsx`) :** Inventaire de catégorie listant la position absolue de chaque vêtement.
- **`ItemList` / `CreativeWork` (`looks/page.tsx`) :** Maillage sémantique du module HPB associant chaque Look aux vêtements qui le composent.

---
**L'architecture SEO technique est en place.** Passez au document `GOOGLE_SEARCH_CONSOLE.md` pour initier l'indexation.
