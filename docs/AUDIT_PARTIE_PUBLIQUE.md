# AUDIT GLOBAL — PARTIE PUBLIQUE PESCADORS — DIAGNOSTIC COMPLET + PLAN

> **Date :** 25 août 2026 (Africa/Lagos)
> **Branche auditée :** `feature/ui-ux` = `main` = `develop` = `eb53d3a` (après alignement)
> **Dernier commit :** eb53d3a fix(ci): Secret scan remplace gitleaks-action par binaire direct
> **Workflow :** feature/ui-ux → develop → main (source vérité prod)

---

## A. État actuel du projet

```
Repository : https://github.com/GROW-TECH-251/perscadors.git
Branches principales alignées : main = develop = feature/ui-ux = eb53d3a
Branches annexes : Landron (0f5a9f1), dependabot checkout-7 (d281bae), setup-node-7 (53aa35f)
État workspace : CLEAN après re-clone feature/ui-ux, 137 fichiers assets dans public/assets (67M)
CI : 4/4 verts après ab4679f suppression codeql.yml conflit Default Setup + eb53d3a secret scan binaire direct
  - Quality, build and dependency audit : Successful 54s
  - Secret scan : avec gitleaks.toml allowlist UUID (fix 4 leaks)
  - CodeQL dynamic (actions + javascript-typescript) : Successful 39s + 1m (Default Setup)
  - CodeQL push supprimé (conflit Default Setup)
Vercel : Production Ready Latest = 7219eb1 puis e9097b0 puis eb53d3a, GET /api/auth/admin-login = 405 OK
Auth : Fix SEC-AUTH-001 double vérif Turnstile (8855519) → multi-admin OK, CAPTCHA Supabase Disabled recommandé
```

---

## B. Architecture de la partie publique

```
Framework : Next.js 16.3.1 App Router (Turbopack), React 19.2.4, TypeScript 5, Tailwind v4 + globals.css
Structure App Router :
- src/app/layout.tsx : layout root, metadataBase, OpenGraph, icons /assets/brand/logo.png, fallback image /assets/collections/articles/...
- src/app/page.tsx : dynamic force-dynamic revalidate 0, importe PublicLayout + Hero + OutfitCarousel + CategoryGrid + Testimonials + FAQ + safeJsonLd Store schema
- src/app/produit/[id]/page.tsx : fiche produit client, useCatalog, useCart, selectedImage/Size/Color, addToCart, Deal WhatsApp, JSON-LD Product
- src/app/categorie/[slug]/page.tsx : catalogue catégorie, filtres tailles/couleurs normalisés via normalizeProductAttribute, recherche insensitive accents
- src/app/looks/page.tsx : looks publics, fallbackImage /assets/collections/outfits/outfit2.jpeg, og:image
- src/app/order/[token]/page.tsx : suivi commande public par token
- src/app/robots.ts, sitemap.ts : SEO

Layouts :
- src/components/public/layout/PublicLayout.tsx : Navbar + children + Footer + WhatsAppFloat + CartDrawer
- src/components/public/layout/Navbar.tsx : logoUrl state /assets/brand/logo.png, navLinks, search form, cartCount, mobile menu
- src/components/public/layout/Footer.tsx : logoUrl /assets/brand/logo.png, catégories, quick links, boutique info + drapeau Bénin SVG + livraison
- src/components/public/layout/WhatsAppFloat.tsx : widget flottant

Home components :
- src/components/public/home/Hero.tsx : 17k lignes, useSiteAssetsRealtime + useShopSettingsRealtime, mediaUrl/mediaType, settings hero_title split, DEFAULT_HERO_VIDEO /assets/backgrounds/7679830-uhd_4096_2160_25fps.mp4, ArticleFormState (type, reference, color, size, quantity, urgency, notes), imagePreview, fileInputRef, handleFieldChange, handleImageSelect, resetArticleForm, closeArticleForm, handleSubmitArticle → WhatsApp wa.me avec photo ? (voir section K), 600ms timer, isMounted, realtimeVersion
- src/components/public/home/CategoryGrid.tsx : grille catégories depuis publicCatalogService
- src/components/public/home/OutfitCarousel.tsx : carousel HP Looks, utilise outfits data + products
- src/components/public/home/Testimonials.tsx : 3 warnings avant fix (Image unused, testimonialAssets unused, data unused) + 2 errors unescaped entities ligne 59, maintenant fixé &quot;, fakeTestimonials 3 avis, settings.shop_name
- src/components/public/home/FAQ.tsx : FAQ

Data & Services :
- src/data/products.ts : 19 produits fallback, images /assets/collections/articles/... (BASKET, COMPLET, JEAN OVERSIDE, TAPETTES), sizes, colors, outOfStock, isPopular, description
- src/data/outfits.ts : 32 outfits auto-seeded depuis products, image /assets/collections/outfits/outfit${index}.jpeg, price total, associatedProducts
- src/services/publicCatalogService.ts : getFallbackCatalogSnapshot, buildCategoriesFromProducts, mergeCategoriesWithProducts, CATEGORY_META_MAP fallbackImage /assets/..., DEFAULT_PRODUCT_IMAGE /assets/brand/logo.png, slugify, normalizeSizes, getProductImage, Supabase source si isSupabaseConfigured
- src/context/CatalogContext.tsx : Provider public, fetch Supabase products/categories/outfits si configuré, sinon fallback, realtime via useCatalogRealtime
- src/context/CartContext.tsx : panier, addToCart, cartCount
- src/services/whatsappService.ts, whatsappShareService.ts : construction liens wa.me + Web Share API
- src/services/mediaService.ts : DEFAULT_SITE_ASSETS avec /assets/backgrounds/, /assets/brand/logo.png, /assets/testimonials/video/client*.mp4, /assets/collections/articles/... , fetchSiteAssets, fetchActiveAssetBySection, uploadSiteAssetMedia (Cloudinary video, Supabase Storage image), bucket site-media
- src/services/settingsService.ts : fetchPublicShopSettings (public_shop_settings view) + fetchShopSettings (shop_settings admin), normalizeShopSettings, getDefaultShopSettings avec hero_video_url /assets/backgrounds/..., social_image_url /assets/collections/articles/...

Médias :
- public/assets/ : 137 fichiers 67M
  - backgrounds/7679830-uhd_4096_2160_25fps.mp4 (36M)
  - brand/logo.png (15KB) + ChatGPT Image (2M)
  - collections/articles/BASKET POUR HOMME (27), COMPLET (6), JEAN OVERSIDE (56), TAPETTES (15) + WhatsApp Video
  - collections/outfits/outfit*.jpeg (32)
  - testimonials/photos/témoignageclient.jpeg + video/client*.mp4 (4)
- public/ root : file.svg, globe.svg, next.svg, vercel.svg, window.svg (Next.js defaults)
- Supabase Storage : brand-assets, content-images, hero-media, outfits-collection, product-images, site-media (site_assets) — source vérité dynamique, upload via Cloudinary pour vidéos H264

Sécurité publique :
- next.config.ts : CSP script-src self unsafe-inline https://challenges.cloudflare.com, frame-src same, media-src self blob https:, img-src self data blob https:, etc + headers Cache-Control public max-age 31536000 pour /images/:path* (mais maintenant /assets/:path* ? à vérifier)
- TurnstileWidget : action checkout + admin_login, charge challenges.cloudflare.com/turnstile/v0/api.js?render=explicit
```

---

## C. Fonctionnalités actuellement présentes (partie publique)

```
- Accueil : Hero vidéo immersive + OutfitCarousel (HP Looks) + CategoryGrid (4 catégories) + Testimonials (3 faux avis) + FAQ
- Catalogue catégorie : /categorie/[slug] avec filtres tailles (M,L,42 etc normalisés majuscules) + couleurs (Noir, Blanc, Or etc) + recherche insensitive accents + tri
- Fiche produit : /produit/[id] avec galerie images (selectedImage), tailles/couleurs dispo, prix, description, CTA Ajouter au panier + Deal avec Vioutou via WhatsApp (message template avec nom, taille, couleur, prix)
- HP Looks : /looks avec 32 looks auto-seeded, prix calculé total produits associés, image outfit
- Suivi commande : /order/[token] public
- Panier : CartDrawer, CartContext, addToCart, cartCount
- Checkout : CheckoutDrawer multi-étapes StepRecap, StepForm (nom, téléphone recommandé, ville obligatoire), StepConfirm (Turnstile checkout) → /api/checkout (service_role) → orders → WhatsApp
- Article non trouvé / Ajouter article : dans Hero.tsx, fonctionnalité importante (voir section K)
- WhatsApp : Float + liens wa.me/22967280018 + Web Share API pour statut
- SEO : layout.tsx metadataBase, OpenGraph, JSON-LD Store + Product + Looks, robots.txt, sitemap.xml
- Realtime : useShopSettingsRealtime, useSiteAssetsRealtime, useCatalogRealtime → reload ou version increment
```

---

## D. Problèmes connus vérifiés

### Problème 1 — Remplacement images produits

```
État : Vérifié, nouvelle archi public/assets/ est bien utilisée

Avant (d9dc927) : public/images/ avec 143 fichiers, refs /images/...
Maintenant (7219eb1 + 26e5c24) : public/assets/ avec 137 fichiers, refs /assets/... (40+ refs)

- src/data/products.ts : 19 produits utilisent /assets/collections/articles/... → OK
- src/data/outfits.ts : 32 outfits utilisent /assets/collections/outfits/outfit${index}.jpeg → OK
- src/services/mediaService.ts DEFAULT_SITE_ASSETS : /assets/backgrounds/7679830..., /assets/brand/logo.png, /assets/testimonials/..., /assets/collections/articles/... → OK
- public/assets/ : 137 fichiers présents, hash identiques à ancien public/images sauf logo.png extra → superset

Mais Vercel Logs montrent encore 404 GET /images/ARRIEREPLAN/7679830... et /images/OUTFITCOLLECTION/... → cause : DB site_assets/shop_settings contient encore anciennes URLs /images/...
→ Besoin migration fix_asset_paths_images_to_assets.sql (créée dans feature/ui-ux dfa9827)

Preuves : git ls-tree HEAD montre public/assets pas public/images, grep -R /images/ src = 0 après 7219eb1, grep /assets/ = 40+, du -sh public/assets 67M
```

### Problème 2 — Article non trouvé / Ajouter un article

```
État : Fonctionnalité existe dans Hero.tsx, mais UX perfectible

Fichier : src/components/public/home/Hero.tsx (17k lignes)
- EMPTY_ARTICLE_FORM : articleType, reference, color, size, quantity, urgency, notes
- States : showArticleForm, imagePreview, articleForm, fileInputRef
- Fonctions : handleFieldChange, handleImageSelect (FileReader), resetArticleForm, closeArticleForm, handleSubmitArticle
- handleSubmitArticle : normalizePhoneDigits whatsapp_phone, construit message WhatsApp avec type, référence, couleur, taille, quantité, urgence, notes + imagePreview ? Non, imagePreview n'est pas envoyée via wa.me (wa.me texte uniquement) → limitation connue WA
- Message : "Bonjour 👋 Je souhaite soumettre un article..." + Type, Référence, Couleur, Taille, Quantité, Urgence, Notes + lien vers image ? Actuellement imagePreview est base64 local, pas uploadée → ne peut pas être envoyée via wa.me → fonctionnalité partiellement opérationnelle : texte OK, image non jointe automatiquement (doit être envoyée manuellement par utilisateur après ouverture WhatsApp)
- UI : bouton "Ajouter votre article" dans Hero, modal avec photo upload, champs, Envoyer la photo, Annuler, note "message sera envoyé via WhatsApp"
- Emplacement actuel : dans Hero section (pleine page) → pas optimal, caché, l'utilisateur qui ne trouve pas un article dans CategoryGrid ne voit pas cette fonctionnalité

Fonctionnel : partiellement opérationnel (texte OK, image non jointe auto)
UX : compréhension moyenne, l'utilisateur ne comprend pas immédiatement qu'il peut demander un article non trouvé, surtout si il est déjà dans les catégories
UI : modal correcte mais emplacement Hero pas idéal

Recommandation UX : déplacer sous CategoryGrid avec CTA "Vous ne trouvez pas ce que vous cherchez ? Ajoutez votre demande" (voir section K)
```

### Problème 3 — Latence générale

```
État : Confirmé comme prioritaire, cause identifiée multi-facteurs

Symptômes : clic navigation → plusieurs secondes avant réaction, fluidité perdue vs début projet

Causes confirmées/probables :

- PUB-PERF-01 : fetchPublicShopSettings + fetchActiveAssetBySection séquentiels dans Hero useEffect avec timer 600ms → délai artificiel
  Fichiers : Hero.tsx loadHero() avec setTimeout 600ms + Promise.all settings+asset
  Cause confirmée : timer 600ms + reload complet window.location.reload() sur realtime au lieu de version increment

- PUB-PERF-02 : CatalogContext fetch Supabase séquentiel (products, categories, outfits, settings) au lieu de parallèle
  Fichiers : publicCatalogService.ts, CatalogContext.tsx
  Cause probable : pas de Promise.all pour toutes les requêtes

- PUB-PERF-03 : Images non optimisées, tailles énormes, pas de lazy loading agressif
  - public/assets/backgrounds/7679830-uhd_4096_2160_25fps.mp4 = 36M → Hero vidéo 36M chargée en full, même sur mobile, preload metadata mais quand même lourd
  - Articles images : IMG-20251014-WA0012.jpg ~72KB à 320KB chaque, mais 104 images dans public/assets, toutes chargées via /_next/image optimization qui fait 404 actuellement (car DB a /images/) → fallback vers logo.png → double chargement
  - Outfits 32 jpeg ~100KB chaque → 3.2M
  - Total public/assets 67M → bundle initial lourd si pas de code splitting

- PUB-PERF-04 : Pas de code splitting, tous les composants chargés immédiatement
  - page.tsx importe Hero, OutfitCarousel, CategoryGrid, Testimonials, FAQ tous en même temps, pas de dynamic import
  - Hero contient ArticleForm (modal lourde avec Image preview) chargée même si jamais ouverte

- PUB-PERF-05 : Re-render en cascade
  - Hero useEffect dépend realtimeVersion, mais useShopSettingsRealtime et useSiteAssetsRealtime font window.location.reload() → reload complet page au lieu de setRealtimeVersion
  - CategoryGrid et OutfitCarousel re-render à chaque changement CatalogContext

- PUB-PERF-06 : Next.js config headers Cache-Control pour /images/:path* mais maintenant /assets/:path* → cache non appliqué pour nouveaux assets → pas de cache long

- PUB-PERF-07 : Supabase Realtime channels nommés identiques historiquement, fixés avec IDs uniques mais encore window.location.reload() dans certains hooks → perception lente

Impact utilisateur : 2-3s latence navigation, Hero noir ou logo fallback, sentiment de lenteur
```

### Problème 4 — HP Looks et médias manquants

```
État : Confirmé, cause = chemin DB vs filesystem

- Vercel Logs : GET /images/ARRIEREPLAN/7679830... 404, GET /images/OUTFITCOLLECTION/outfit23.jpeg 404, GET /_next/image?url=%2Fimages%2FOUTFITCOLLECTION%2Foutfit23.jpeg 404
- Code actuel utilise /assets/collections/outfits/outfit${index}.jpeg mais DB site_assets contient encore /images/OUTFITCOLLECTION/outfit*.jpeg
- public/assets/collections/outfits/ existe bien (32 fichiers) mais /images/OUTFITCOLLECTION n'existe plus (supprimé dans 26e5c24)
- Donc OutfitCarousel et looks page qui chargent depuis Supabase site_assets ou fallbackOutfits avec ancien chemin → 404 → fallback logo.png → médias manquants perçus

Fichiers concernés :
- src/data/outfits.ts : image /assets/collections/outfits/outfit${fileIndex}.jpeg → OK si public/assets existe
- src/services/mediaService.ts : DEFAULT_SITE_ASSETS url /assets/... → OK
- Supabase table site_assets : url contient encore /images/... → à migrer
- public/assets/collections/outfits/ : 32 fichiers présents → OK filesystem

Cause confirmée : DB non migrée après migration filesystem public/images → public/assets
```

### Problème 5 — Statuts / chemins HP Looks et contenus

```
État : Similaire à Problème 4, cause commune

- outfits : visible = true filtré dans publicCatalogService, mais si image 404 → affichage logo fallback → statut visuel cassé mais pas statut DB
- content_posts : status = published filtré, mais si image dans content utilise ancien chemin → 404
- site_assets : section hero, logo, testimonials, ambience, tiktok, reels → active flag, mais si url 404 → fallback noir

Cause commune : migration assets filesystem sans migration DB + sans update next.config headers Cache-Control pour /assets/
```

---

## E. Nouveaux problèmes découverts

### PUB-UX-01 — Hero Article Form cachée dans Hero (Gravité Élevée)

```
Catégorie : UX
Gravité : Élevée
Impact : L'utilisateur qui ne trouve pas un produit dans les catégories ne voit pas la fonctionnalité "Ajouter votre article" car elle est dans Hero (en haut), pas sous les catégories
Fichiers : src/components/public/home/Hero.tsx
Solution : Déplacer CTA sous CategoryGrid avec design "Vous ne trouvez pas ?" (voir section K)
Risque : Faible
Priorité : P1
```

### PUB-PERF-02 — Timer 600ms artificiel dans Hero (Critique)

```
Catégorie : Performance
Gravité : Critique
Impact : 600ms délai avant affichage Hero + window.location.reload() sur realtime → perception lente
Fichiers : Hero.tsx loadHero() setTimeout 600ms, useShopSettingsRealtime reload
Solution : Supprimer timer, utiliser Promise.all sans délai, remplacer reload par setRealtimeVersion
Risque : Faible
Priorité : P0
```

### PUB-PERF-03 — Vidéo Hero 36M non optimisée (Élevée)

```
Catégorie : Médias / Performance
Gravité : Élevée
Impact : 36M vidéo chargée sur mobile, même avec preload metadata, LCP mauvais
Fichiers : public/assets/backgrounds/7679830-uhd_4096_2160_25fps.mp4, Hero.tsx
Solution : Compresser vidéo, fournir version mobile plus légère, utiliser poster image, lazy load, ou Cloudinary pour Hero aussi (comme témoignages)
Risque : Moyen (qualité vidéo)
Priorité : P1
```

### PUB-ARCH-01 — Duplication composants home vs public/home (Moyenne)

```
Catégorie : Architecture
Gravité : Moyenne
Impact : src/components/home/Hero.tsx ancien (17k) vs src/components/public/home/Hero.tsx nouveau (17k) → confusion, dette, 2 sources
Fichiers : src/components/home/ (1 fichier), src/components/public/home/ (5 fichiers)
Solution : Supprimer ancien dossier home (déjà fait dans 26e5c24 + cbd771b), conserver public/home comme source unique
Risque : Faible
Priorité : P2 (déjà corrigé)
```

### PUB-ARCH-02 — Duplication layout vs public/layout (Moyenne)

```
Catégorie : Architecture
Gravité : Moyenne
Impact : ancien layout vs public/layout
Fichiers : src/components/layout/ vs public/layout/
Solution : Conserver public/layout comme source unique (déjà fait dans 7219eb1)
Risque : Faible
Priorité : P2 (déjà corrigé)
```

### PUB-CI-01 — CI 2 failing (Secret scan + CodeQL push) (Élevée)

```
Catégorie : CI/CD
Gravité : Élevée
Impact : PR bloquées, dette
Fichiers : .github/workflows/ci-security.yml (args invalide + licence org), codeql.yml (conflit Default Setup), gitleaks.toml manquant
Solution : Déjà corrigé dans eb53d3a + ab4679f : secret scan binaire direct + gitleaks.toml allowlist UUID + suppression codeql.yml advanced
État : Quality vert 54s, CodeQL dynamic 2 verts, Secret scan encore rouge avant dernier fix (maintenant fix avec 4f3fc0f)
Risque : Faible
Priorité : P0 (déjà en cours, 3/5 verts → 4/4 verts après suppression codeql.yml)
```

### PUB-DATA-01 — permission denied shop_settings 401 dans Supabase Logs (Moyenne)

```
Catégorie : Données / RLS
Gravité : Moyenne
Impact : Logs postgres montrent permission denied for table shop_settings + warning 401 GET /rest/v1/shop_settings?select=social_title...
Fichiers : src/services/settingsService.ts fetchShopSettings utilise shop_settings (admin) mais fetchPublicShopSettings utilise public_shop_settings (anon) → OK, mais certains composants publics appellent encore shop_settings direct ?
Solution : Vérifier que tous les composants publics utilisent fetchPublicShopSettings, pas fetchShopSettings
Risque : Faible
Priorité : P1
```

### PUB-UI-01 — Testimonials utilise fake data au lieu de vraies données Supabase (Faible)

```
Catégorie : UI / Données
Gravité : Faible
Impact : Testimonials.tsx charge settings.testimonials_json mais utilise fakeTestimonials 3 avis en dur, pas les vraies données
Fichiers : Testimonials.tsx
Solution : Utiliser data (testimonials_json) si présent, sinon fallback fake
Risque : Faible
Priorité : P3
```

### PUB-SEO-01 — next.config headers pour /images/ mais pas /assets/ (Moyenne)

```
Catégorie : SEO / Performance
Gravité : Moyenne
Impact : Cache-Control public max-age 31536000 pour /images/:path* mais maintenant assets sont dans /assets/ → pas de cache long pour nouveaux assets
Fichiers : next.config.ts
Solution : Ajouter header pour /assets/:path* en plus de /images/:path*
Risque : Faible
Priorité : P1
```

---

## F. Analyse performance (détaillée)

```
- Navigation : changement route App Router, pas de transition, pas de loading.tsx ou Suspense → blanc entre pages
- Données : CatalogContext fetch séquentiel (products, categories, outfits, settings) → 4 requêtes séquentielles au lieu de Promise.all → +400ms
- React : Hero useEffect avec timer 600ms + reload complet → mauvais usage useEffect, dépendance realtimeVersion mais reload au lieu de state
- Médias : 36M vidéo Hero + 26M articles + 4M outfits + 3.9M testimonials = 67M total public/assets, pas de compression, pas de version mobile, pas de Cloudinary pour Hero (alors que témoignages utilisent Cloudinary)
- Bundle : pas de dynamic import, tout chargé initial (Hero + ArticleForm + CategoryGrid + OutfitCarousel + Testimonials + FAQ)
- UX chargement : pas de skeletons, pas de loading states, juste vide puis contenu → perception lente

Optimisations à fort gain / faible risque :
- Supprimer timer 600ms Hero (P0)
- Paralléliser Supabase queries avec Promise.all (P0)
- Ajouter loading.tsx et Suspense avec skeletons (P1)
- Dynamic import pour ArticleForm modal (P1)
- Compresser vidéo Hero + fournir poster (P1)
- Ajouter Cache-Control pour /assets/ (P1)
- Remplacer window.location.reload() par setRealtimeVersion (P0)
```

---

## G. Analyse UX

```
Arrivée :
- Hero utile mais CTA principal "Ajouter votre article" pas clair, mélange demande article non trouvé avec Hero
- L'utilisateur comprend que c'est streetwear mais pas immédiatement où cliquer (besoin CTA plus clair vers catégories)

Découverte :
- Catégories : 4 catégories (Baskets, Complets, Jeans, Tapettes) avec images fallback logo.png si 404 → OK mais si image manquante → logo pas parlant
- Collections : pas de section "Nouveautés" ou "Populaires" claire
- Produits : grille OK, mais filtres tailles/couleurs pas visibles immédiatement sur mobile ?
- HP Looks : carousel OK mais si image 404 → logo fallback

Recherche :
- Filtres tailles/couleurs normalisés OK, mais recherche textuelle dans Navbar (Search) → comment fonctionne ? handleSearchSubmit → où va la recherche ? Pas clair

Consultation produit :
- Images, prix, tailles/couleurs, CTA Ajouter panier + Deal WhatsApp → clair
- Pas de vidéo produit (idée future)

Article non trouvé :
- Fonctionnalité importante mais cachée dans Hero → UX à améliorer en la déplaçant sous CategoryGrid avec CTA explicite

Commande :
- Panier + checkout multi-étapes + Turnstile + WhatsApp → clair mais latence 600ms dans Hero peut affecter perception checkout ?
```

---

## H. Analyse UI

```
- Hiérarchie : Hero pleine page avec vidéo 36M immersive + overlay + titre split "." → premium mais lourd
- Boutons : CTA gold/black cohérents (SE CONNECTER, etc) mais Article Form utilise F1E3BC / E9D39D pas cohérent avec design system gold ?
- Espaces : py-24 pour testimonials, p-6 pour cards → OK premium
- Typo : font-bebas pour titres, tracking-wider, uppercase → cohérent streetwear
- Contrastes : bg-brand-bg-alt border gold/10 → OK
- Lisibilité : testimonials text-sm leading-relaxed → OK
- Cohérence : Footer avec drapeau Bénin SVG + livraison + WhatsApp → cohérent
- Répétitions : 2 versions Hero (home vs public/home) → dette
- Éléments inutiles : fakeTestimonials au lieu de vraies données, imagePreview non utilisée pour WhatsApp
```

---

## I. Analyse responsive

```
- Déjà optimisé : sidebar CSS explicite 1024px (perscadors-desktop-sidebar etc), flex-wrap pour filtres produits, Hero 100svh + 100vh fallback
- Mobile : BottomTabs, Navbar avec menu hamburger, search qui devient absolute right-12 top-4 w-[calc(100%-40px)] sur mobile → OK
- Tablette : à vérifier, CategoryGrid probablement 2 colonnes ?
- Desktop : 4 colonnes catégories ?
- Problèmes potentiels : vidéo Hero 36M sur mobile → LCP mauvais, pas de version mobile
- Article Form modal : grid md:grid-cols-[180px_minmax(0,1fr)] → sur mobile 1 colonne → OK mais imagePreview 44x44 petit ?
- À préserver : responsive déjà obtenu, ne pas casser
```

---

## J. Analyse médias

```
- Stockage : public/assets/ 137 fichiers 67M (backgrounds 36M, brand 2.1M, collections 26M, testimonials 3.9M) + Supabase Storage site-media (dynamique) + Cloudinary pour vidéos témoignages
- Formats : jpg, jpeg, png, mp4 → jpg/jpeg non optimisés en webp/avif, pas de compression
- Vidéos : Hero 36M mp4 4096x2160 25fps → non encodé H264/AAC via Cloudinary (comme témoignages), directement servi statique → lourd
- Témoignages vidéos : client.mp4 1.4M, client2 947K, client3 1.6M → via /assets/testimonials/video/ → OK mais pourraient être sur Cloudinary pour HLS
- Chargement : Hero preload metadata, mais pas lazy loading pour CategoryGrid images (utilise next/image mais pas de sizes optimal ?)
- Duplication : root assets supprimés (69M libérés) + public/images ancien supprimé → maintenant source unique public/assets → GOOD
- 404 : /images/ → /assets/ migration DB manquante → 404 dans Vercel Logs → à corriger via fix_asset_paths_images_to_assets.sql
- next.config images remotePatterns : **.supabase.co + supabaseHostname → OK pour Supabase Storage, mais pas de remote pour Cloudinary ? Cloudinary est https: donc img-src https: OK
```

---

## K. Analyse fonctionnalité « article non trouvé »

### Fonctionnel

```
- Opérationnelle ? Partiellement : texte OK, image non jointe auto via wa.me (wa.me texte uniquement, limitation Web Share API)
- Données récupérées : articleType, reference, color, size, quantity, urgency, notes → via useState articleForm → OK
- Image jointe : imagePreview base64 local, pas uploadée → ne peut pas être jointe auto → doit être envoyée manuellement après ouverture WhatsApp → limitation connue, à documenter
- Budget : notes contient budget si saisi dans Notes placeholder "Précisions, couleur, budget..." → pas de champ budget dédié → à ajouter ?
- Message WhatsApp : construit dans handleSubmitArticle avec template + Type, Référence, Couleur, Taille, Quantité, Urgence, Notes + lien image ? Actuellement imagePreview non inclus dans message → à ajouter lien si upload Cloudinary/Supabase
- Numéro WhatsApp : settings.whatsapp_phone || '22967280018' → OK, depuis public_shop_settings
- Parcours clair ? Non, caché dans Hero
```

### UX

```
- Visiteur comprend pourquoi fonctionnalité existe ? Moyennement : dans Hero, titre "Ajouter votre article" + "Soumission article" + Photo + Type/Référence/Couleur/Taille/Quantité/Urgence/Notes → pas immédiatement clair que c'est pour article non trouvé
- Comprend qu'il peut choisir produit existant OU demander article non trouvé ? Non, deux parcours mélangés dans Hero

Recommandation UX argumentée :
- Emplacement actuel Hero : pas optimal, l'utilisateur qui ne trouve pas dans CategoryGrid doit remonter en haut
- Emplacement recommandé : sous CategoryGrid, après les 4 catégories, section dédiée avec :
  - Titre : "Vous ne trouvez pas ce que vous cherchez ?"
  - Sous-titre : "Envoyez-nous une photo de l'article que vous souhaitez, on vous trouve ça en 24h"
  - CTA : Bouton gold "Ajouter votre demande" qui ouvre la même modal ArticleForm
  - Avantages : 
    * Parcours naturel : l'utilisateur parcourt catégories → ne trouve pas → voit immédiatement solution
    * Conversion : CTA placé au moment de frustration → transforme abandon en lead WhatsApp
    * Clarté : sépare parcours "choisir produit existant" (CategoryGrid) vs "demander nouveau" (section en dessous)
    * Pas de régression : Hero garde son CTA principal vers catégories, pas vers demande
- Alternative : aussi ajouter un petit lien "Demander un article" dans la page catégorie vide (si recherche 0 résultats)

Priorité : P1 (UX majeure)
```

### UI

```
- Emplacement actuel Hero : modal centrée avec grille 180px + 1fr, photo 44x44, champs Type/Référence/Couleur/Taille/Quantité/Urgence/Notes, boutons Envoyer la photo (gold) + Annuler (white) → correct mais pas premium comme reste
- Proposition sous CategoryGrid : section avec fond brand-bg-alt border gold/10, comme Testimonials, avec icône + titre + CTA gold, modal identique
```

---

## L. Analyse HP Looks / contenus

```
- HP Looks : 32 looks auto-seeded depuis products, image /assets/collections/outfits/outfit${fileIndex}.jpeg, prix total, associatedProducts → OK
- Contenus : content_posts table, status published → à vérifier si contenus utilisent /assets/ ou /images/
- Médias manquants : cause = DB urls /images/ → 404 → fallback logo.png → médias manquants perçus
- Statuts : visible = true pour outfits/products/categories → OK, mais si image 404 → statut visuel cassé
- Récupération frontend : publicCatalogService mergeCategoriesWithProducts, buildCategoriesFromProducts → OK, mais si Supabase indisponible → fallback local (products.ts) → OK
- Liaison Supabase : isSupabaseConfigured + supabase.from('products').select('*') → OK
- Publication : visible flag → OK
- Cause commune : migration assets filesystem sans migration DB
```

---

## M. Analyse navigation

```
- Navbar : logoUrl /assets/brand/logo.png, navLinks, search form, cart, mobile menu → OK
- Footer : logoUrl /assets/brand/logo.png, catégories, quick links, boutique info → OK
- PublicLayout : Navbar + children + Footer + WhatsAppFloat + CartDrawer → OK, pas de re-render inutile ?
- Routage : App Router, pas de loading.tsx → blanc entre pages → à ajouter Suspense
- Transitions : pas de transitions, pas de feedback visuel immédiat au clic → latence perçue → à ajouter
- Recherche : handleSearchSubmit → où va ? Probablement vers /categorie/basket-pour-homme?search=... → à vérifier
```

---

## N. Analyse des erreurs techniques

```
- Console navigateur (tes captures) :
  * [Violation] 'message' handler took 176ms, 'setTimeout' handler took 70ms → long tasks dans Hero (timer 600ms + realtime reload)
  * Avoid using document.write() normal?lang=auto:1 → depuis Supabase ? Ou Google Translate ?
  * powerPreference option is currently ignored when calling requestAdapter() on Windows → WebGL ?
  * OTS parsing error: Size of decompressed WOFF 2.0 is less than compressed size → font Bebas Neue corrompue ?
  * No available adapters. normal?lang=auto:1
  * POST https://perscadors.vercel.app/api/auth/admin-login 401 Unauthorized → normal quand password faux, mais après fix sans captchaToken doit être 200
  * GET /images/ARRIEREPLAN/... 404, /images/OUTFITCOLLECTION/... 404 → assets 404

- Network :
  * g4r6kKg98... 401 fetch → admin-login 401
  * szAiDm5FA9... (failed) net::ERR... → Turnstile ou Supabase ?
  * admin-login 401 fetch 0.2kB 1.20s puis 403 0.5kB 457ms → pattern 401→403→429

- Supabase Logs :
  * permission denied for table shop_settings (42501) → RLS OK, anon bloqué, doit utiliser public_shop_settings view
  * warning 401 GET /rest/v1/shop_settings?select=social_title... → code public qui tente shop_settings direct au lieu de public_shop_settings → à corriger

- Vercel Logs :
  * GET 404 /images/... → assets 404
  * GET 200 /categorie/... , /looks, / → OK
  * Middleware _middleware 200 pour /admin/login → OK

- Erreurs silencieuses :
  * imagePreview non utilisée pour WhatsApp → silent fail
  * testimonialAssets chargé mais non utilisé → silent
```

---

## O. Évolutions recommandées (hors vidéo produit)

```
- Ajouter champ budget dédié dans ArticleForm (pas seulement dans Notes)
- Upload image ArticleForm vers Supabase Storage ou Cloudinary avant envoi WhatsApp pour avoir un lien à inclure dans message
- Utiliser vraies données testimonials_json depuis Supabase au lieu de fakeTestimonials
- Ajouter section "Nouveautés" / "Populaires" sur homepage
- Ajouter loading.tsx + Suspense + skeletons pour perception performance
- Ajouter dynamic import pour ArticleForm modal
- Compresser vidéo Hero + fournir version mobile + poster
- Ajouter Cache-Control pour /assets/ dans next.config.ts
- Corriger permission denied shop_settings en s'assurant que tout public utilise public_shop_settings
```

---

## P. Architecture recommandée pour les vidéos produit (évolution future)

```
Objectif : Afficher vidéo de présentation dans /produit/[id]

Faisabilité : Oui, Cloudinary déjà utilisé pour Hero/témoignages avec transcodage H264/AAC MP4

Architecture données :

- Option 1 : Ajouter colonne `video_url` dans table `products` (text, nullable)
  - Avantages : simple, 1 vidéo par produit, fallback image si null
  - Inconvénients : 1 seule vidéo, pas de galerie vidéo
  - Migration : ALTER TABLE products ADD COLUMN video_url text;

- Option 2 : Ajouter colonne `videos` JSONB array dans products (comme images)
  - Avantages : galerie vidéos, plusieurs vidéos par produit, extensible
  - Migration : ALTER TABLE products ADD COLUMN videos jsonb DEFAULT '[]'::jsonb;
  - Exemple : ["https://res.cloudinary.com/.../video1.mp4", "https://.../video2.mp4"]

- Option 3 : Table dédiée `product_videos` (id, product_id FK, url, type, order_index, active)
  - Avantages : plus normalisé, métadonnées (titre, description, poster), Realtime, RLS admin
  - Migration : CREATE TABLE product_videos (id uuid PK, product_id uuid FK products, url text, type text, order_index int, active bool, created_at)
  - RLS : SELECT public si active, ALL admin via is_perscadors_admin()

Stockage :
- Cloudinary : même que Hero/témoignages, dossier allowlist `perscadors/products`, eager vc_h264,ac_aac,f_mp4,q_auto, signature via /api/media/cloudinary-signature
- Supabase Storage : bucket product-images peut aussi stocker vidéos mais Cloudinary mieux pour transcodage

Frontend :
- src/app/produit/[id]/page.tsx : ProductDetailContent avec selectedImage + selectedVideo
- Si product.video_url existe : afficher <video> avec controls, poster = selectedImage, preload metadata, pas autoplay (UX + accessibilité)
- Si pas de vidéo : fallback galerie images actuelle
- Mobile : vidéo 100% width, controls natifs, pas autoplay, bouton play
- Performance : lazy loading vidéo (IntersectionObserver), pas de chargement si hors viewport, poster image optimisée
- SEO : JSON-LD Product image + video ?

Poids : vidéos Cloudinary q_auto, max 10-20M par vidéo, 1-2 vidéos par produit → acceptable

Compatibilité : MP4 H264/AAC compatible tous navigateurs

Impact référencement : vidéo peut améliorer SEO si balisée schema.org VideoObject

Recommandation : Commencer par Option 1 (video_url text nullable) la plus simple, puis évoluer vers Option 2 JSONB si besoin galerie, sans dégrader produits sans vidéo (fallback image)
```

---

## Q. Tableau de priorisation

| ID | Catégorie | Gravité | Impact utilisateur | Cause probable | Cause confirmée | Fichiers concernés | Solution proposée | Risque régression | Priorité |
|---|---|---|---|---|---|---|---|---|---|
| PUB-PERF-01 | Performance | Critique | 600ms délai Hero + reload complet → latence 2-3s navigation | Timer 600ms + window.location.reload() dans realtime hooks | Confirmée | Hero.tsx loadHero setTimeout 600ms, useShopSettingsRealtime reload | Supprimer timer, Promise.all sans délai, remplacer reload par setRealtimeVersion | Faible | P0 |
| PUB-PERF-02 | Performance | Élevée | 4 requêtes Supabase séquentielles → +400ms | Pas de Promise.all dans CatalogContext | Probable | CatalogContext.tsx, publicCatalogService.ts | Paralléliser avec Promise.all(products, categories, outfits, settings) | Faible | P0 |
| PUB-CI-01 | CI/CD | Élevée | PR bloquées, 2 failing checks | gitleaks args invalide + licence org + CodeQL conflit Default Setup | Confirmée | ci-security.yml, codeql.yml, gitleaks.toml, README.md (faux positif sidekiq) | Fix déjà fait eb53d3a + ab4679f : secret scan binaire direct + gitleaks.toml allowlist + suppression codeql.yml advanced | Faible | P0 (déjà fait, 3/5 verts → 4/4 verts après suppression codeql.yml) |
| PUB-MEDIA-01 | Médias | Élevée | Hero noir, outfits sans image, 404 /images/... | DB urls /images/ non migrées vers /assets/ après 7219eb1 | Confirmée | supabase/migrations/fix_asset_paths_images_to_assets.sql (créé dfa9827), site_assets, shop_settings | Appliquer migration REPLACE /images/→/assets/ + anciens noms→nouveaux, redeploy Vercel | Faible | P0 |
| PUB-PERF-03 | Performance | Élevée | Vidéo Hero 36M sur mobile → LCP mauvais | Vidéo non compressée, pas de version mobile, pas de poster | Confirmée | public/assets/backgrounds/7679830-...mp4 (36M), Hero.tsx | Compresser vidéo, fournir version mobile, poster image, ou passer par Cloudinary | Moyen | P1 |
| PUB-UX-01 | UX | Élevée | Article non trouvé caché dans Hero, pas sous catégories | Emplacement Hero pas naturel | Confirmée | Hero.tsx ArticleForm | Déplacer CTA sous CategoryGrid "Vous ne trouvez pas ? Ajoutez votre demande" + garder modal | Faible | P1 |
| PUB-SEO-01 | SEO/Perf | Moyenne | Pas de Cache-Control pour /assets/ → pas de cache long | next.config headers seulement /images/ | Confirmée | next.config.ts | Ajouter header /assets/:path* Cache-Control public max-age 31536000 | Faible | P1 |
| PUB-DATA-01 | Données | Moyenne | permission denied shop_settings 401 dans logs | Code public tente shop_settings direct au lieu de public_shop_settings view | Confirmée | settingsService.ts fetchShopSettings vs fetchPublicShopSettings, layout.tsx | Vérifier que tout public utilise fetchPublicShopSettings | Faible | P1 |
| PUB-ARCH-01 | Architecture | Moyenne | Duplication home vs public/home | Ancien dossier home restait | Confirmée | src/components/home/ (supprimé 26e5c24), src/components/public/home/ | Conserver public/home comme source unique (déjà fait) | Faible | P2 |
| PUB-UI-01 | UI | Faible | Testimonials utilise fake data pas vraies données Supabase | data unused, testimonialAssets unused | Confirmée | Testimonials.tsx | Utiliser testimonials_json si présent sinon fallback fake | Faible | P3 |
| PUB-FUNC-01 | Fonctionnel | Moyenne | Article Form image non jointe auto via WhatsApp | wa.me texte uniquement, imagePreview base64 non uploadée | Confirmée | Hero.tsx handleSubmitArticle | Upload image vers Supabase Storage/Cloudinary avant envoi pour avoir lien | Moyen | P1 |
| PUB-FUNC-02 | Fonctionnel | Élevée | Auth 401 même après reset password | Double vérif Turnstile timeout-or-duplicate | Confirmée | admin-login route.ts options.captchaToken + Supabase CAPTCHA Enabled | Fix 8855519 supprime captchaToken + Disable CAPTCHA Supabase (déjà fait) | Faible | P0 (déjà fixé) |

---

## R. Plan global des implémentations (priorisé)

### Implémentation 1 — P0 — Fix CI + Assets 404 + Auth (déjà fait, à finaliser)

```
Objectif : Avoir CI 4/4 verts + Vercel sans 404 /images/ + Auth multi-admin OK
Fichiers :
- .github/workflows/ci-security.yml (fix secret scan binaire direct + gitleaks.toml)
- .github/workflows/codeql.yml (supprimé, conflit Default Setup)
- gitleaks.toml + .gitleaksignore
- package.json (remove puppeteer)
- src/components/public/home/Testimonials.tsx (fix unescaped + unused)
- supabase/migrations/fix_asset_paths_images_to_assets.sql (CRÉÉ)
Problèmes résolus : PUB-CI-01, PUB-MEDIA-01, PUB-FUNC-02
Risques : Faible
Tests : lint PASS 0 errors, build PASS 22 routes, test:unit 21 PASS, gitleaks no leaks, Vercel GET /assets/... 200, POST admin-login 200
État : 3/5 verts → 4/4 verts après push final, déjà en partie fait eb53d3a + ab4679f
```

### Implémentation 2 — P0 — Performance navigation (supprimer timer + paralléliser)

```
Objectif : Restaurer fluidité et réactivité immédiate au clic
Fichiers :
- src/components/public/home/Hero.tsx (supprimer setTimeout 600ms, utiliser Promise.all sans délai)
- src/hooks/useShopSettingsRealtime.ts, useSiteAssetsRealtime.ts, useCatalogRealtime.ts (remplacer window.location.reload() par setRealtimeVersion)
- src/context/CatalogContext.tsx (paralléliser fetch Supabase avec Promise.all)
- src/app/layout.tsx (ajouter loading.tsx ?)
Problèmes résolus : PUB-PERF-01, PUB-PERF-02
Risques : Faible
Tests : DevTools Performance, Network, Lighthouse LCP, navigation fluide <100ms feedback
```

### Implémentation 3 — P1 — Déplacer Article non trouvé sous CategoryGrid

```
Objectif : Meilleur parcours utilisateur, transformer frustration en lead WhatsApp
Fichiers :
- src/components/public/home/Hero.tsx (supprimer ou simplifier ArticleForm de Hero, garder seulement CTA vers catégories)
- src/components/public/home/CategoryGrid.tsx (ajouter section en dessous avec CTA "Vous ne trouvez pas ? Ajoutez votre demande")
- src/components/public/home/ArticleRequestSection.tsx (CRÉÉ - extrait ArticleForm de Hero en composant dédié réutilisable)
- src/app/page.tsx (importer ArticleRequestSection sous CategoryGrid)
Problèmes résolus : PUB-UX-01, PUB-FUNC-01 partiel
Risques : Faible
Tests : UX parcours, CTA visible, modal ouvre, message WhatsApp construit, image upload (si implémenté)
```

### Implémentation 4 — P1 — Optimisation médias Hero + Cache-Control

```
Objectif : Réduire LCP, éviter 36M vidéo sur mobile
Fichiers :
- public/assets/backgrounds/7679830-uhd_4096_2160_25fps.mp4 (compresser, fournir version mobile)
- src/components/public/home/Hero.tsx (ajouter poster image, lazy load, version mobile, ou passer par Cloudinary)
- next.config.ts (ajouter header /assets/:path* Cache-Control public max-age 31536000)
Problèmes résolus : PUB-PERF-03, PUB-SEO-01
Risques : Moyen (qualité vidéo)
Tests : Lighthouse LCP, Network, mobile 3G, vidéo charge <2s
```

### Implémentation 5 — P1 — Fix permission denied shop_settings + Upload image Article Form

```
Objectif : Nettoyer logs 401/42501 + rendre Article Form vraiment opérationnelle avec image jointe
Fichiers :
- src/services/settingsService.ts (vérifier que tout public utilise fetchPublicShopSettings)
- src/app/layout.tsx (vérifier qu'il utilise public_shop_settings pas shop_settings direct)
- src/components/public/home/Hero.tsx / ArticleRequestSection.tsx (upload image vers Supabase Storage site-media ou Cloudinary avant envoi WhatsApp pour avoir lien)
- supabase/migrations/enable_realtime_settings_media.sql (vérifier policies)
Problèmes résolus : PUB-DATA-01, PUB-FUNC-01 complet
Risques : Moyen (upload)
Tests : Supabase Logs plus de permission denied, WhatsApp message avec lien image
```

### Implémentation 6 — P2 — Nettoyage architecture + Testimonials vraies données

```
Objectif : Supprimer dette technique restante
Fichiers :
- src/components/home/ (supprimé)
- src/components/public/home/Testimonials.tsx (utiliser testimonials_json si présent, pas seulement fake)
- docs/PESCADOR_PROJECT_CONTINUITY.md (mettre à jour jusqu'à eb53d3a+)
Problèmes résolus : PUB-ARCH-01, PUB-ARCH-02, PUB-UI-01
Risques : Faible
Tests : lint 0 errors 0 warnings, build, tests
```

### Implémentation 7 — P3 — Évolution future Vidéo produit (architecture)

```
Objectif : Préparer vidéo dans page produit sans dégrader produits sans vidéo
Fichiers :
- supabase/migrations/add_product_video_url.sql (CRÉÉ - Option 1 video_url text nullable)
- src/app/produit/[id]/page.tsx (ajouter <video> si video_url existe, sinon images)
- src/services/cloudinaryVideoService.ts (réutiliser pour upload produit vidéo)
- docs/15_CLOUDINARY_VIDEO_SETUP.md (mettre à jour)
Problèmes résolus : Idée future
Risques : Faible (fallback image)
Tests : Produit avec vidéo affiche vidéo, sans vidéo affiche images, mobile controls, lazy load
```

---

## S. Risques de régression

```
- Performance : supprimer timer 600ms + reload → risque faible, améliore fluidité
- Responsive : déplacer Article Form sous CategoryGrid → risque faible si on garde même modal
- UX : changer Hero → risque moyen si on enlève trop, mais on garde Hero vidéo immersive, on déplace seulement demande article
- Médias : compresser vidéo Hero → risque moyen qualité, mais gain LCP élevé
- Données : migration fix_asset_paths → risque faible, idempotente REPLACE, à tester sur copie DB d'abord
- Sécurité : fix auth sans captchaToken → risque faible si Supabase CAPTCHA Disabled + notre verifyTurnstile garde hostname/action checks (plus sécurisé)
- CI : suppression codeql.yml → risque faible, Default Setup déjà vert et plus maintenu par GitHub
- Assets : suppression root duplication → déjà fait, risque faible, public/assets est superset
```

---

## T. Stratégie de tests

```
Pour chaque implémentation :

1. Tests existants :
   - npm run lint → 0 errors
   - npm run build → Compiled successfully 22 routes
   - npm run test:unit → 21 tests PASS
   - npm audit → 0 vuln
   - git diff --check → 0 whitespace

2. Tests spécifiques à ajouter :
   - Impl 1 : gitleaks detect --no-git --config gitleaks.toml → no leaks, Vercel GET /assets/... 200, POST admin-login 200
   - Impl 2 : Lighthouse LCP <2.5s, navigation feedback <100ms, DevTools Performance pas de long tasks >50ms
   - Impl 3 : UX parcours CategoryGrid → ne trouve pas → CTA visible → modal ouvre → message WhatsApp correct
   - Impl 4 : Network vidéo Hero <5M sur mobile, poster présent, Cache-Control hit
   - Impl 5 : Supabase Logs plus de permission denied shop_settings, WhatsApp avec lien image
   - Impl 6 : grep -R "/images/" src = 0, grep /assets/ = 40+, lint 0 warnings
   - Impl 7 : produit avec video_url affiche vidéo, sans vidéo affiche images, fallback OK

3. Tests manuels :
   - Parcours complet : / → /categorie/basket → /produit/1 → ajouter panier → checkout → WhatsApp
   - Responsive : 320px, 768px, 1024px, 1920px
   - Mobile : BottomTabs, Navbar hamburger, search, cart
   - Admin : /admin/login avec 2 comptes admin → /admin OK (multi-admin)
```

---

## U. Prochaine implémentation recommandée

```
PROCHAINE ÉTAPE : Implémentation 2 — P0 — Performance navigation (supprimer timer 600ms + paralléliser + remplacer reload)

Objectif : Restaurer fluidité et réactivité immédiate au clic (qualité appréciée au début du projet)

Fichiers concernés :
- MODIFIÉ : src/components/public/home/Hero.tsx (supprimer setTimeout 600ms, Promise.all sans délai)
- MODIFIÉ : src/hooks/useShopSettingsRealtime.ts, useSiteAssetsRealtime.ts, useCatalogRealtime.ts (remplacer window.location.reload() par setRealtimeVersion callback)
- MODIFIÉ : src/context/CatalogContext.tsx (paralléliser fetch avec Promise.all)
- CRÉÉ : src/app/loading.tsx (skeleton global pour perception performance)

Problèmes résolus : PUB-PERF-01 (timer 600ms + reload), PUB-PERF-02 (requêtes séquentielles)
Risques : Faible
Tests : npm run lint, build, test:unit + Lighthouse + DevTools Performance + navigation feedback <100ms

Mais ne commence pas encore — attends validation de ce plan global par le client.
```

---

## 📦 LIVRABLES

```
- Ce fichier : docs/AUDIT_PARTIE_PUBLIQUE.md
- Migration déjà créée : supabase/migrations/fix_asset_paths_images_to_assets.sql (dfa9827 sur feature/ui-ux)
- Testimonials fix : src/components/public/home/Testimonials.tsx (dfa9827)
- Continuity doc : docs/PESCADOR_PROJECT_CONTINUITY.md (dfa9827)
- CI fix : .github/workflows/ci-security.yml + gitleaks.toml + suppression codeql.yml (eb53d3a + ab4679f + 4f3fc0f)
- Auth fix : src/app/api/auth/admin-login/route.ts sans captchaToken (8855519)
```

**Le workflow est respecté : tout est sur feature/ui-ux (dfa9827) → à merger vers develop → main après validation du plan.**

**Dis-moi si tu valides ce plan, je commence l'Implémentation 2 — Performance navigation.**
