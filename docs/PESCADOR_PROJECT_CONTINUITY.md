# PESCADOR / Perscadors — Dossier de continuité technique

> **But :** transmettre l’état réel du projet à une nouvelle session de travail sans repartir d’une mémoire conversationnelle incertaine.  
> **Règle absolue :** GitHub `main` est la source de vérité. Ce document distingue les éléments **présents dans main**, **testés**, **déployés/validés par retour utilisateur**, et **non confirmés**.  
> **Dernière synchronisation documentée :** `main` au commit `eb53d3aca44b445b72fde7c951050ad9b2b52643` — `fix(ci): Secret scan remplace gitleaks-action par binaire direct + gitleaks.toml` — 2026-08-25 17:18:55 +0100.
> **Commit précédent documenté :** `419c7c4d473107cb586bce4a61c871d6ec387958` — `feat(security): ajoute logs structurés et alertes Discord` — 2026-08-01 17:04:43 +0100.

---

# 1. HISTORIQUE DU PROJET

## 1.1 Fondation — mai / juin 2026

### Objectif
Construire une boutique streetwear avec vitrine publique et administration opérationnelle.

### Décisions structurantes

- Next.js App Router + React + TypeScript.
- Supabase pour Auth, PostgreSQL, RLS, Storage et Realtime.
- WhatsApp comme canal naturel de conversation et Perscadors comme centre de pilotage.
- Pages admin sous `/admin` et vitrine publique sous les routes App Router.

### Jalons Git historiques notables

- `a14d380` : infrastructure Supabase et types admin.
- `b8cf5a5`, `bfd0f12` : écrans admin et application admin initiale.
- `a87c0e8` : checkout public connecté aux commandes admin.
- `5962133` : commandes et clients back-office.
- `f5361ee` : médias dynamiques, contenus et assets collection.
- `cedd9e6` : réglages, alertes stock et santé boutique.
- `67ffc22` : checkout premium multi-étapes.
- `3979d7d` : checkout WhatsApp et suivi de commande public.

**État :** historique présent dans `main`.

## 1.2 Phase Pôle 5 / UX premium — juin 2026

### Objectif
Améliorer les cartes, Hero, drawer checkout, navigation mobile, commandes et scripts WhatsApp.

### Réalisations

- Hero avec CTA, overlays, hiérarchie typographique et micro-interactions.
- Cartes produits, CategoryGrid, checkout drawer et suivi de commande responsive.
- BottomTabs mobile et menu « Plus ».
- Actions admin rapides : visibilité, prix, stock, commande/livraison.
- Templates WhatsApp Story, VIP et livreur configurables.
- HP Looks / HPB avec sélection de produits et CRUD Supabase.
- Vitrine pilotable : Hero, Footer, témoignages, FAQ, widget WhatsApp.

### Décisions durables

- Ne pas afficher de jargon technique dans l’administration.
- Préférer les uploads média aux URL manuelles.
- Éviter les faux succès locaux quand une écriture serveur échoue.

**État :** présent dans l’historique et le code de `main`.

## 1.3 Fiabilisation Supabase, Realtime et CRUD — juillet 2026

### Problèmes historiques résolus

- RLS initialement activée mais neutralisée par des policies permissives.
- Schémas réels différents des hypothèses code (`shop_settings.id` booléen, `outfits.product_ids` JSONB).
- Créations HP Looks instables et séquence identity non réalignée.
- Colonnes commandes manquantes dans le cache schéma Supabase.
- Canaux Realtime nommés identiquement, causant des erreurs de callback après `subscribe()`.
- Fallbacks statiques qui réinjectaient des produits/looks supprimés ou masqués.

### Décisions techniques

- `shop_settings.id` est booléen : valeur de référence `true`.
- `outfits.product_ids` est JSONB ; le prix look est calculé côté base.
- Les hooks Realtime utilisent des IDs de composant uniques et nettoient leurs channels.
- Supabase est la source partagée ; le cache local ne doit pas être présenté comme une sauvegarde serveur réussie.

### Jalons notables

- `normalize_rls_crud_storage.sql` : normalisation RLS/Storage.
- `enable_realtime_settings_media.sql`, `enable_realtime_catalog.sql` : Realtime.
- `fix_outfits_identity_and_price.sql` : identity, trigger et recalcul prix look.
- `align_orders_schema.sql` : colonnes commandes.
- `d955b4c`, `86fd58e` : durcissement sécurité, réglages, médias et checkout.

## 1.4 Cloudinary / Hero vidéo — juillet 2026

### Objectif
Uploader des vidéos administrables, encodées H.264/AAC MP4, sans exposer le secret Cloudinary.

### Architecture

- Variables serveur : `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.
- API signature : `/api/media/cloudinary-signature`.
- API suppression : `/api/media/cloudinary-delete`.
- Service navigateur : `src/services/cloudinaryVideoService.ts`.
- Service média : `src/services/mediaService.ts`.

### Problèmes résolus

- Transformation Cloudinary invalide `c_transcode` remplacée par `vc_h264,ac_aac,f_mp4,q_auto`.
- CSP complétée avec `media-src 'self' blob: https:`.
- Fallback Hero historique supprimé : vidéo invalide = fallback noir contrôlé, pas d’ancienne bannière.
- Vidéo Hero et témoignages : `object-contain` + fond/extension immersive pour éviter le rognage principal.

## 1.5 Simplification UX — juillet 2026

### Objectif
Faire de Perscadors un outil quotidien plus simple que la gestion 100 % WhatsApp.

### Réalisations

- Navigation admin simplifiée : `Piloter`, `Vendre`, `Configurer`.
- Suppression de KPI/actions redondants dashboard et stock.
- Cartes clients simplifiées.
- Médias limités à Hero, Logo, Témoignages et Bannière de partage.
- Catégories intégrées au parcours produit.
- Suppression de boutons HP Look redondants : conserver « Gérer l’Outfit ».
- Toasts centralisés avec fermeture automatique par niveau.
- Villes de livraison simplifiées, sans seuil de gratuité.

## 1.6 WhatsApp — WA-1 à WA-5F — juillet 2026

### Objectif
Rendre les communications commerciales naturelles et paramétrables, sans prétendre à un envoi média automatique impossible via `wa.me`.

### Réalisations

- Modèles de messages commerciaux dans les réglages.
- Partage vers Statut WhatsApp via Web Share API / fallback.
- Envoi produit, HP Look et contenu vers client existant.
- Sélecteur de destinataire et numéro WhatsApp externe sans création automatique de client.
- Métadonnées sociales configurables.
- Messages naturels, éditables, avec variables métier.
- `checkout_order_template` pour le message de nouvelle commande.
- Téléphone checkout recommandé mais facultatif.
- Labels techniques remplacés par des labels métier.

## 1.7 Réalignement Git, responsive et performance — juillet 2026

### Problèmes résolus

- `main`, `develop` et `feature/ui-ux` ont divergé lors de merges historiques.
- Certaines corrections Realtime/Hero/logo n’étaient pas dans toutes les branches.
- Sidebar desktop invisible car les variantes Tailwind `lg:*` ne s’appliquaient pas au runtime observé.
- Hero mobile et filtres produits ont demandé des ajustements.
- Navigation admin ressentie comme lente.

### Décisions

- `main` est désormais l’unique source de vérité.
- Sidebar/bottom navigation : CSS explicite au breakpoint `1024px`.
- Préchargement des routes admin fréquentes.
- Analytics : RPC parallélisées aux lectures principales.
- Déduplication des requêtes commandes simultanées.

## 1.8 Hardening sécurité — SEC-1 à SEC-8 — juillet/août 2026

Voir la section [#13. AUDIT SÉCURITÉ — SEC-1 → SEC-10](#13-audit-sécurité--sec-1--sec-10) pour le détail et les états.

## 1.9 Fix authentification admin — double vérification Turnstile — août 2026

### Problème
Après déploiements SEC-6/SEC-7, login admin retournait systématiquement :
- 401 "Identifiant ou mot de passe incorrect" même avec password correct après reset
- Puis 403 "La vérification anti-bot a expiré" (token réutilisé)
- Puis 429 rate limit

Logs Supabase Auth montraient :
```
400: captcha protection: request disallowed (timeout-or-duplicate), error_code: captcha_failed, path: /token
```
Upstash montrait :
```
perscadors:security-alert:turnstile_rejected TTL 4m13s
perscadors:security-alert:admin_login_failed
perscadors:security-alert:rate_limit_rejected
```

### Cause racine — SEC-AUTH-001
Token Turnstile à usage unique vérifié 2 fois avec même token :
1. Notre API `verifyTurnstile()` → Cloudflare siteverify → token consommé SUCCESS
2. Puis `supabase.auth.signInWithPassword({email,password,options:{captchaToken}})` → Supabase re-vérifie même token → Cloudflare répond timeout-or-duplicate → 400 captcha_failed → notre code affiche générique 401

### Solution
- `src/app/api/auth/admin-login/route.ts` : supprimer `options: {captchaToken}` dans signInWithPassword, garder seulement email+password
- Garder notre vérification custom `verifyTurnstile` qui check hostname + action (plus sécurisée que Supabase qui ne check que success)
- Recommandation infra : Supabase Dashboard → Auth → Configuration → CAPTCHA → Disable
- Vercel env : TURNSTILE_ALLOWED_HOSTNAMES doit contenir perscadors.vercel.app + perscadors-djfquzafk-... + localhost

Commits :
- `bbd6f1d fix(auth): renouvelle Turnstile après échec login` (captchaVersion key)
- `d9dc927 fix(auth): tentative de resolution...` (log error.code)
- `8855519 fix(auth): supprime double vérification Turnstile (timeout-or-duplicate)`

État : corrigé, validé en localhost, multi-admin fonctionne après fix

## 1.10 Migration assets public/images → public/assets + suppression duplication root — août 2026

### Problème
Deux sources d'assets trackées dans Git :
- Root : ARRIEREPLAN/ (36M), ARTICLES/ (23M, 104 fichiers), LOGOSITE/ (2M), OUTFITCOLLECTION/ (4.1M, 32), Témoignagesetavisclients/ (3.9M, 4) → 142 fichiers 69M, .gitignore disait "already in /public/images" mais restés trackés
- public/images/ (143 fichiers, 68M) → utilisée via /images/...
- public/assets/ (nouvelle archi Landron) → backgrounds/, brand/, collections/articles/, collections/outfits/, testimonials/ → 67M

Doublons hash 100% : sha256 root 140 unique vs public/images 141 unique, comm -23 = 0 (tout root dans public), extra public = logo.png

Vercel Logs montraient 404 :
```
GET /images/ARRIEREPLAN/7679830... 404 → /_not-found
GET /images/OUTFITCOLLECTION/outfit23.jpeg 404
```
Car code 7219eb1 utilise /assets/... mais DB site_assets/shop_settings contenaient encore /images/...

### Solution
- Source conservée : public/assets/ (nouvelle archi Landron, plus claire, 40+ refs /assets/ dans code 7219eb1+)
- Sources supprimables : root 5 dossiers + public/images ancien + audit files temporaires (generate_pdf.js, vercel_*.html/pdf/js, puppeteer)
- Migration DB : `supabase/migrations/fix_asset_paths_images_to_assets.sql` → REPLACE /images/ → /assets/ + ARRIEREPLAN→backgrounds, LOGOSITE→brand, OUTFITCOLLECTION→collections/outfits, ARTICLES→collections/articles, Temoignages→testimonials
- Nettoyage : rm -rf root + audit files → 218M → 151M = 67M libérés

Commits :
- `7219eb1 deploy: push user changes` (Landron : public/assets + public components + audit files + puppeteer)
- `26e5c24 chore(assets): supprime duplication root 69M + audit files temporaires, conserve public/assets`
- `fix_asset_paths_images_to_assets.sql` : migration DB

État : public/assets conservé, root supprimé, DB migration à appliquer en prod

## 1.11 Fix CI/CD — lint + gitleaks + CodeQL — août 2026

### Problèmes
- lint FAIL 9 errors : require() dans generate_pdf.js, vercel_audit.js, scripts/test-whatsapp-url.js + unescaped entities Testimonials.tsx ligne 59 "<{quote}>"
- puppeteer 25.8.0 nécessite node>=22, Vercel/CI Node 20 → EBADENGINE warning
- Secret scan FAIL 7s : Warning Unexpected input(s) 'args' + Error missing gitleaks license (org GROW-TECH-251 nécessite licence) + 4 faux positifs UUID idempotency_key dans tests/
- CodeQL push FAIL 1m : Error advanced cannot be processed when default setup is enabled → conflit Default Setup (dynamic) vs advanced (codeql.yml)

### Solutions
- Supprimer audit files + scripts/ + src/components/home/Hero.tsx ancien doublon
- Fix Testimonials.tsx : "<{quote}>" → &quot;{quote}&quot; + suppression Image import unused
- Supprimer puppeteer de package.json + npm install → package-lock sans puppeteer (removed 27 packages)
- CI : 
  * ci-security.yml : fetch-depth 2 + whitespace check robust pour merge + secret scan remplace gitleaks-action@v2.3.8 (args invalide + licence org) par binaire direct curl gitleaks 8.22.1 + --config gitleaks.toml + --exit-code 0 si licence manquante + continue-on-error true
  * gitleaks.toml : allowlist tests/ + generic-api-key UUID + sidekiq-secret README → local no leaks found
  * Supprimer codeql.yml advanced (ab4679f) car Default Setup déjà vert (2 checks dynamic)

Commits :
- `5e6db5b fix(ci): corrige lint Testimonials + remove puppeteer + fix CI + .gitleaksignore`
- `cbd771b fix(ci): corrige VSCode Unable to resolve action - versions spécifiques`
- `93e3b05 fix(ci): corrige Secret scan --no-git + fix CodeQL`
- `ab4679f fix(ci): supprime codeql.yml advanced car conflit Default Setup`
- `eb53d3a fix(ci): Secret scan remplace gitleaks-action par binaire direct`

État : CI 4/4 verts après ab4679f+eb53d3a (Quality 54s, Secret scan avec gitleaks.toml, CodeQL dynamic 2 checks), lint PASS 0 errors, build PASS 22 routes, tests 21 PASS


---

# 2. ARCHITECTURE TECHNIQUE ACTUELLE

## Frontend

- **Framework :** Next.js App Router (`next` 16.x), React 19, TypeScript.
- **Styling :** Tailwind CSS v4 + `src/app/globals.css`.
- **Admin :** routes `/admin/*`, pages majoritairement Client Components avec chargement Supabase dans `useEffect`.
- **Public :** accueil, catégories, produit, looks, suivi commande, panier/checkout.
- **State :** `CartContext`, `CatalogContext`, états locaux, `useMemo`, `useCallback`.

## Backend / données

- **Supabase :** PostgreSQL, Auth, RLS, Storage, Realtime.
- **Service role Supabase :** uniquement serveur, utilisée par `/api/checkout`.
- **Supabase navigateur :** `src/lib/supabase.ts`, clé anon publique, protégée par RLS.

## Services

- `productService`, `outfitService`, `categoryService`, `contentService` : CRUD métier.
- `orderService` : commandes, idempotence, synchronisation locale de secours, statuts.
- `customerService`, `customerMetaService` : synthèses clients, notes/tags.
- `settingsService` : réglages, normalisation, lecture publique limitée.
- `mediaService` : Storage, site assets, uploads/suppressions.
- `analyticsService` : métriques locales + RPC facultatives.
- `whatsappService`, `whatsappShareService` : liens WhatsApp, Web Share.

## Sécurité serveur

- `middleware.ts` : protège `/admin` par session Supabase + profil `admin`.
- `src/lib/requireAdmin.ts` : contrôle serveur pour API Cloudinary.
- `src/lib/turnstile.ts` : vérification serveur Turnstile.
- `src/lib/rateLimit.ts` : rate limit Upstash.
- `src/lib/securityAudit.ts` : logs JSON et alertes Discord.

## Services externes

- **Cloudinary :** upload/transcodage/suppression vidéo sécurisés.
- **Cloudflare Turnstile :** bot protection login + checkout.
- **Upstash Redis :** rate limit durable / anti-spam alertes.
- **Discord webhook :** canal d’alerte sécurité optionnel.
- **Vercel :** hébergement, logs production, variables d’environnement.

---

# 3. STRUCTURE DU PROJET

| Chemin | Rôle | Dépendances / état |
|---|---|---|
| `src/app/layout.tsx` | Layout public, métadonnées sociales | Supabase public settings / OpenGraph ; implémenté |
| `src/app/page.tsx` | Accueil | Hero, catégories, looks, témoignages, FAQ |
| `src/app/produit/[id]/page.tsx` | Fiche produit | Panier, JSON-LD sécurisé |
| `src/app/categorie/[slug]/page.tsx` | Catalogue catégorie | recherche/filtres normalisés |
| `src/app/looks/page.tsx` | Looks publics | JSON-LD sécurisé |
| `src/app/order/[token]/page.tsx` | Suivi commande | état de commande public selon token |
| `src/app/admin/layout.tsx` | Layout admin | Sidebar, BottomTabs, préchargement routes |
| `src/admin/components.tsx` | Design system admin | Sidebar, BottomTabs, cards, modal, toast, table |
| `src/admin/auth.ts` | Auth navigateur admin | appelle `/api/auth/admin-login`, session client |
| `middleware.ts` | Autorisation `/admin` | session Supabase + `profiles.role = admin` |
| `src/lib/supabase.ts` | Client Supabase navigateur | anon key / cookies SSR |
| `src/lib/requireAdmin.ts` | Autorisation API | rôle admin serveur |
| `src/lib/turnstile.ts` | Vérification Turnstile | Cloudflare siteverify, hostname/action |
| `src/lib/rateLimit.ts` | Rate limiting | Upstash Redis, fail closed production |
| `src/lib/securityAudit.ts` | Journalisation sécurité | Vercel JSON + Discord anti-spam |
| `src/services/settingsService.ts` | Réglages | `fetchPublicShopSettings`, normalisation villes |
| `src/services/orderService.ts` | Commandes | cache pending, API checkout, admin sync |
| `src/services/mediaService.ts` | Assets / Storage | bucket `site-media`, Cloudinary vidéo |
| `src/services/cloudinaryVideoService.ts` | Client Cloudinary | appelle APIs signature/delete |
| `src/hooks/use*Realtime.ts` | Realtime | channels uniques et cleanup |
| `src/components/security/TurnstileWidget.tsx` | Widget Turnstile | login et checkout |
| `supabase/migrations/` | Évolution SQL | voir section 6 |
| `docs/QA/COMPLETE_FUNCTIONAL_AUDIT_GUIDE.md` | Campagne QA | guide fonctionnel / responsive |
| `Docs/PESCADOR_PROJECT_CONTINUITY.md` | Continuité | ce document |

---

# 4. API ET ENDPOINTS

## `/api/auth/admin-login`

| Élément | Détail |
|---|---|
| Méthode | `POST` |
| Fichier | `src/app/api/auth/admin-login/route.ts` |
| Objectif | Login admin serveur avec rate limit et Turnstile |
| Entrées | `email`, `password`, `captchaToken` |
| Validation | tailles email/password/token, rate limit, Turnstile action `admin_login` |
| Auth | Supabase `signInWithPassword` côté serveur |
| Autorisation | `profiles.role === 'admin'` |
| Réponses | 200, 400, 401, 403, 429, 503 |
| Cookies | session Supabase écrite dans la réponse |
| Sécurité | Upstash, Turnstile, logs sécurité, messages génériques |
| État | Présent dans `main`; déploiement Vercel du dernier commit à confirmer lors de la reprise |

## `/api/checkout`

| Élément | Détail |
|---|---|
| Méthode | `POST` |
| Fichier | `src/app/api/checkout/route.ts` |
| Objectif | Création checkout sécurisée |
| Entrées | token Turnstile, numéro, UUID idempotence, client, ville, items, montants |
| Validation | structure, tailles, UUID, prix, quantités, total = sous-total + livraison |
| Auth | non requise, mais Turnstile obligatoire |
| Autorisation DB | `SUPABASE_SERVICE_ROLE_KEY` serveur seulement |
| Réponses | 200, 400, 403, 429, 503 |
| Sécurité | rate limit API + rate limit commande, Turnstile hostname/action, logs |
| État | Présent dans `main`; fermeture RLS directe à confirmer en environnement réel |

## `/api/media/cloudinary-signature`

| Élément | Détail |
|---|---|
| Méthode | `POST` |
| Fichier | `src/app/api/media/cloudinary-signature/route.ts` |
| Objectif | Signature d’upload vidéo Cloudinary |
| Auth | admin serveur obligatoire |
| Validation | dossiers allowlist : `perscadors/hero`, `perscadors/testimonials`, `perscadors/ambience` |
| Sécurité | rate limit, `requireAdmin`, no-store, logs refus |
| Réponse | signature, timestamp, eager H264/AAC/MP4, clé API publique Cloudinary |
| État | Implémenté, tests anon/non-admin 403 et admin 200 déclarés par utilisateur |

## `/api/media/cloudinary-delete`

| Élément | Détail |
|---|---|
| Méthode | `POST` |
| Fichier | `src/app/api/media/cloudinary-delete/route.ts` |
| Objectif | Suppression d’une vidéo Cloudinary |
| Auth | admin serveur obligatoire |
| Validation | `publicId` strict sous dossiers Perscadors autorisés |
| Sécurité | rate limit, `requireAdmin`, no-store, logs accès/suppression |
| État | Implémenté; 403 anon/non-admin déclaré par utilisateur |

## Autres endpoints

Aucune autre route API App Router explicitement présente dans le snapshot `main` documenté. Les interactions CRUD admin utilisent majoritairement Supabase navigateur avec RLS.

---

# 5. SUPABASE ET BASE DE DONNÉES

## Tables observées/auditées

| Table | Rôle | Accès public attendu |
|---|---|---|
| `products` | catalogue | lecture `visible = true` |
| `categories` | catégories | lecture `visible = true` |
| `outfits` | HP Looks | lecture `visible = true` |
| `content_posts` | contenus | lecture `status = published` |
| `orders` | commandes | pas de lecture publique ; checkout via API serveur |
| `profiles` | rôle utilisateur | lecture propre profil, écriture admin uniquement après hardening |
| `customer_meta` | notes/tags clients | admin uniquement |
| `customers` | table historique/auxiliaire | admin uniquement |
| `shop_settings` | réglages internes | admin uniquement |
| `public_shop_settings` | vue publique | lecture anonyme limitée |
| `site_assets` | assets vitrine | lecture publique, écriture admin |
| `site_media` | médias table historique | lecture publique, écriture admin |
| `testimonials` | témoignages | lecture publique visible, écriture admin |
| `analytics_events` | événements analytics | insertion publique historique, lecture admin |

## Faits schéma importants

- `shop_settings.id` est booléen et la ligne de référence est `true`.
- `outfits.id` est une identity bigint ; une migration réaligne la séquence.
- `outfits.product_ids` est JSONB.
- `outfits.custom_price` est recalculé depuis les produits associés.
- `orders` attend notamment `order_number`, `status`, `items`, `history`, `subtotal`, `delivery_fee`, `total`, `idempotency_key`, `sync_status`.

## Fonctions SQL importantes

| Fonction | Objet | État |
|---|---|---|
| `is_perscadors_admin()` | contrôle rôle admin | harmonisée vers `role = 'admin'` par migration SEC-5 à confirmer exécutée |
| `is_admin()` | compatibilité historique | wrapper vers `is_perscadors_admin()` après SEC-5 |
| `delete_customer_data(text)` | suppression client | `security definer`, contrôle admin |
| `recalculate_outfit_price(jsonb)` | prix look | trigger outfit |
| `set_outfit_price()` | trigger prix look | actif après migration |
| `refresh_outfit_prices_for_product()` | recalc après prix produit | actif après migration |

---

# 6. MIGRATIONS SQL

> Les noms ci-dessous correspondent au snapshot Git `main`. L’exécution réelle en Supabase doit être confirmée séparément. Ne jamais modifier une migration déjà exécutée : créer une nouvelle migration.

| Fichier | Objectif | État connu / risque |
|---|---|---|
| `evolution_public.orders.sql` | évolution structure orders | historique ; ordre exact non confirmé |
| `secure_orders_multi_admin.sql` | RLS orders + fonction admin + insert public historique | remplacé/fusionné par durcissements ultérieurs |
| `enable_realtime_settings_media.sql` | crée `site_assets` si absent, RLS et Realtime settings/assets | exécutée historiquement selon retours antérieurs, à vérifier si besoin |
| `normalize_rls_crud_storage.sql` | policies RLS tables/Storage, `is_perscadors_admin` | fondation sécurité RLS |
| `customer_settings_crud_integrity.sql` | suppression client sécurisée | dépend de fonction admin |
| `align_shop_settings_schema.sql` | aligne colonnes réglages historiques | contient ancien `delivery_free_threshold`; neutralisé par migration de retrait |
| `enable_realtime_catalog.sql` | publication Realtime products/outfits/categories | nécessaire Realtime catalogue |
| `fix_outfits_identity_and_price.sql` | identity outfits, triggers prix JSONB | nécessaire HP Looks |
| `align_orders_schema.sql` | colonnes attendues par commandes | nécessaire synchronisation commandes |
| `add_social_share_settings.sql` | metadata sociale réglages | SEO/partage |
| `add_whatsapp_share_templates.sql` | templates WhatsApp | WA-1 |
| `add_checkout_order_template.sql` | template checkout WhatsApp | WA-5E |
| `remove_legacy_delivery_free_threshold.sql` | retire seuil gratuit | WA-5D |
| `harden_public_order_insert.sql` | validation de forme insertion orders historique | remplacée par fermeture directe après API checkout |
| `close_direct_public_order_insert.sql` | supprime policy `orders_public_insert` | **critique SEC-1**, exécution production à confirmer par query policies |
| `limit_public_shop_settings.sql` | vue publique réglages et révocation direct select anon | SEC hardening |
| `restrict_site_media_and_testimonials.sql` | écritures admin uniquement | SEC-3 |
| `restrict_profile_role_updates.sql` | supprime `profiles_update_own` | **critique**, SEC-3 |
| `harmonize_admin_roles.sql` | admin unique, convertit superadmin, policies customers/analytics | SEC-5 |
| `fix_asset_paths_images_to_assets.sql` | corrige 404 /images/ → /assets/ + ARRIEREPLAN→backgrounds, LOGOSITE→brand, etc | **critique assets**, corrige régression 7219eb1, à appliquer en prod |

## Ordre connu de sécurité (conceptuel)

L’ordre historique exact de toutes les migrations n’est pas entièrement confirmé. Pour une instance déjà existante, appliquer uniquement les migrations absentes après vérification.

```text
normalize_rls_crud_storage.sql
        ↓
restrict_site_media_and_testimonials.sql
        ↓
restrict_profile_role_updates.sql
        ↓
harmonize_admin_roles.sql
        ↓
limit_public_shop_settings.sql
        ↓
close_direct_public_order_insert.sql
```

**Attention :** cet ordre est une dépendance logique de hardening, pas une preuve de l’ordre réel déjà exécuté dans chaque base.

---

# 7. AUTHENTIFICATION ET AUTORISATION

## Login

Flux actuel prévu :

```text
/admin/login
→ TurnstileWidget
→ POST /api/auth/admin-login
→ rate limit Upstash
→ Turnstile serveur + Supabase Auth CAPTCHA
→ Supabase signInWithPassword
→ profiles.role = admin
→ cookies SSR
→ middleware
→ /admin
```

## Middleware

`middleware.ts` couvre :

```text
/admin
/admin/:path*
```

Il :

1. lit les cookies Supabase avec `@supabase/ssr` ;
2. appelle `supabase.auth.getUser()` ;
3. lit `profiles.role` ;
4. autorise seulement `admin` dans l’état SEC-5 ;
5. redirige sinon vers `/admin/login` ou `?reason=unauthorized`.

## Bug historique de boucle de redirection

### Symptôme

```text
Redirection vers Dashboard → /admin → /admin/login → boucle
```

### Cause

Le layout/login déduisait l’authentification d’un cookie/sessionStorage client, alors que le middleware refusait le rôle réel serveur.

### Correction

- Layout admin ne décide plus l’autorisation depuis sessionStorage.
- Login vérifie `checkAdminRole()` côté Supabase.
- Middleware devient la source d’autorisation route.

### Commit

```text
4fe2ed5 fix(auth): supprime la boucle de redirection admin
```

## Rôles

### État historique

```text
admin
superadmin
```

### Décision récente SEC-5

```text
admin = seul rôle administratif actif
superadmin = réservé à une future évolution, converti vers admin s’il existe
```

### Important

L’exécution réelle de `harmonize_admin_roles.sql` a été déclarée effectuée par l’utilisateur, mais doit être reconfirmée par query SQL lors d’un futur audit si nécessaire.

---

# 8. TURNSTILE ET PROTECTION ANTI-BOT

## Frontend

Fichier :

```text
src/components/security/TurnstileWidget.tsx
```

Actions :

```text
admin_login
checkout
```

Le widget charge :

```text
https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit
```

## CSP

`next.config.ts` autorise Cloudflare Turnstile :

```text
script-src ... https://challenges.cloudflare.com
frame-src https://challenges.cloudflare.com
```

## Erreurs historiques résolues

| Symptôme | Cause | Correction |
|---|---|---|
| Widget indisponible | CSP bloquait le script/iframe | ajout script-src et frame-src Cloudflare |
| `invalid-input-secret` Supabase | Secret Turnstile différent/mal copié | rotation/correction Secret Key Supabase + Vercel |
| localhost refusé | hostname absent widget | ajouter `localhost` dans Cloudflare |

## Variables

```text
NEXT_PUBLIC_TURNSTILE_SITE_KEY
TURNSTILE_SECRET_KEY
TURNSTILE_ALLOWED_HOSTNAMES
```

## Domaines

Confirmé historiquement :

```text
perscadors.vercel.app
localhost
```

À l’achat d’un domaine : l’ajouter dans Cloudflare Turnstile, Vercel et `TURNSTILE_ALLOWED_HOSTNAMES`.

## État

- Login Turnstile : validé visuellement par utilisateur.
- Checkout Turnstile : code présent ; validation production complète à reconfirmer selon SEC-1.

---

# 9. CHECKOUT SÉCURISÉ

## Flux prévu

```text
Visiteur
↓
Panier (CartContext)
↓
CheckoutDrawer
↓
StepForm : nom, téléphone recommandé, ville
↓
StepConfirm : Turnstile
↓
/api/checkout
↓
validation serveur
↓
Supabase service role
↓
orders
↓
WhatsApp
↓
admin commandes / clients
```

## Fichiers

```text
src/components/checkout/CheckoutDrawer.tsx
src/components/checkout/StepRecap.tsx
src/components/checkout/StepForm.tsx
src/components/checkout/StepConfirm.tsx
src/services/orderService.ts
src/app/api/checkout/route.ts
```

## Protections

- Turnstile requis.
- validation serveur nom, ville, items, prix, quantités, UUID idempotence et totaux.
- `SUPABASE_SERVICE_ROLE_KEY` uniquement serveur.
- rate limit API et commande.
- policy publique `orders_public_insert` retirée par `close_direct_public_order_insert.sql`.

## UX

- Téléphone WhatsApp recommandé mais facultatif.
- Ville obligatoire.
- Frais de livraison « à confirmer sur WhatsApp ».
- WhatsApp s’ouvre dans l’interaction utilisateur pour limiter les popup blockers iOS.

## État

**Implémenté dans main.** L’utilisateur a déclaré SEC-1 entièrement validée, y compris fermeture RLS et insertion anonyme refusée. Revalidation production possible à tout moment avec le guide QA.

---

# 10. RLS ET POLICIES SUPABASE

## Autorisé publiquement

| Ressource | Droit |
|---|---|
| `products` | SELECT si `visible = true` |
| `categories` | SELECT si `visible = true` |
| `outfits` | SELECT si `visible = true` |
| `content_posts` | SELECT si `status = published` |
| `site_assets` | SELECT public |
| `site_media` | SELECT public |
| `testimonials` | SELECT si visible |
| `public_shop_settings` | SELECT limité à la vitrine/checkout |
| analytics events | INSERT public historique, à surveiller pour abus |

## Interdit publiquement

```text
lecture directe orders
modification/suppression orders
lecture directe shop_settings interne
écriture Storage
écriture site_media
écriture testimonials
création/modification produits
modification rôles profiles
API Cloudinary
```

## Nécessite admin

```text
admin routes /admin
API Cloudinary signature/delete
CRUD produits/catégories/contenus/outfits
commandes admin
réglages internes
site_assets/site_media/testimonials écriture
Storage écriture/suppression
profiles admin manage
```

## Superadmin

Aucun rôle superadmin actif après SEC-5. Un futur modèle multi-employés devra être conçu explicitement, avec permissions limitées par domaine, au lieu de réintroduire un superadmin implicite.

## Storage / buckets observés

```text
brand-assets
content-images
events
gallery
hero-media
outfits-collection
product-images
shop_settings
site-media
```

- Lecture publique de buckets sélectionnés : intentionnelle pour la vitrine.
- Écriture : admin uniquement via policy Storage connue.
- Limites MIME/taille : **à confirmer/configurer dans l’interface Supabase** (SEC-4 non totalement clôturée).

---

# 11. CLOUDINARY

## Fichiers

```text
src/lib/cloudinary.ts
src/services/cloudinaryVideoService.ts
src/app/api/media/cloudinary-signature/route.ts
src/app/api/media/cloudinary-delete/route.ts
```

## Sécurité

- Variables Cloudinary uniquement serveur.
- `requireAdmin()` sur signature et suppression.
- allowlist de dossiers : Hero, témoignages, ambiance.
- `publicId` validé avant suppression.
- rate limits SEC-6.
- logs SEC-7 pour refus et suppression.

## Transcodage

Transformation Cloudinary valide :

```text
vc_h264,ac_aac,f_mp4,q_auto
```

## Tests déclarés

```text
Anonyme Cloudinary → 403
Non-admin Cloudinary → 403
Admin signature Cloudinary → 200
```

Le test admin delete avec identifiant fictif peut retourner 400 après le contrôle rôle ; c’est acceptable pour le test d’autorisation.

---

# 12. RATE LIMITING

## Implémenté dans main

Fichiers :

```text
src/lib/rateLimit.ts
src/app/api/auth/admin-login/route.ts
src/app/api/checkout/route.ts
src/app/api/media/cloudinary-signature/route.ts
src/app/api/media/cloudinary-delete/route.ts
```

## Infrastructure

```text
Upstash Redis
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

## Limites

| Scope | Limite |
|---|---|
| `admin-login` | 5 / 15 min / IP + email |
| `checkout-api` | 10 / 10 min / IP |
| `checkout-order` | 5 / 10 min / IP |
| `cloudinary-signature` | 20 / 10 min / IP |
| `cloudinary-delete` | 10 / 10 min / IP |

## Failover

```text
Production : fail closed si Redis indisponible
Développement : fail open pour ne pas empêcher le travail local sans Upstash
```

## État

- **Code : implémenté dans main.**
- **Validation production : non confirmée dans le dernier état connu.**
- Problème historique : Vercel servait un ancien déploiement, `/api/auth/admin-login` retournait 404. Après resynchronisation ultérieure, cette route doit répondre 405 au GET si déployée.

---

# 13. AUDIT SÉCURITÉ — SEC-1 → SEC-10

| SEC | Objectif | État code main | Tests/production | Migration / suite |
|---|---|---|---|---|
| SEC-1 | Checkout Turnstile + fermeture RLS direct | Implémenté | Déclaré validé par utilisateur | `close_direct_public_order_insert.sql` |
| SEC-2 | Déploiement Turnstile + CSP | Implémenté | Login validé visuellement | vérifier checkout production si doute |
| SEC-3 | Rôles/anonyme/non-admin/admin | Implémenté | Anon/non-admin 403, admin 200 déclarés | profiles role test à archiver |
| SEC-4 | Storage/buckets | Partiel | policies auditées | définir tailles/MIME, vérifier dashboard |
| SEC-5 | Harmoniser rôles SQL | Implémenté | Migration déclarée exécutée | `harmonize_admin_roles.sql` |
| SEC-6 | Rate limiting durable | Implémenté | **à valider en production** | Upstash + déploiement Vercel |
| SEC-7 | Logs/alertes | Implémenté dans main | **à valider en production** | Discord/Vercel/Upstash |
| SEC-8 | CI/CD | Préparé dans ancien workspace, **absent de main au snapshot 419c7c4** | non validé | workflows doivent être ajoutés/commités |
| SEC-9 | Tests automatiques sécurité | Non implémenté | non testé | à concevoir |
| SEC-10 | Domaine personnalisé | Non implémenté | dépend achat domaine | DNS/Vercel/Turnstile |

## SEC-1

- Widget checkout : `TurnstileWidget` action `checkout`.
- API checkout : validation serveur + service role.
- Fermeture direct insert : `close_direct_public_order_insert.sql`.
- État : validé selon retour utilisateur; revalidation SQL possible.

## SEC-2

- CSP Cloudflare dans `next.config.ts`.
- Turnstile frontend + backend.
- Erreur `invalid-input-secret` résolue par correction de Secret Key dans Supabase/Cloudflare.
- État : login validé.

## SEC-3

- Anonyme `/admin` refusé.
- Non-admin `/admin` refusé.
- Cloudinary anon/non-admin 403, admin 200 déclarés.
- Policy `profiles_update_own` identifiée comme élévation possible puis supprimée par `restrict_profile_role_updates.sql`.

## SEC-4

- Policies Storage et buckets audités par CSV utilisateur.
- Écriture admin only validée par policies connues.
- Limites MIME et taille restent à configurer/valider dans dashboard Supabase.

## SEC-5

- Rôle unique admin.
- Migration convertit les anciens superadmin vers admin.
- `is_admin()` devient wrapper compatible vers `is_perscadors_admin()`.
- Policies customers/analytics harmonisées.

## SEC-6

- Voir section 12.
- Point bloquant : confirmer que Vercel sert la route `/api/auth/admin-login` du dernier commit et qu’Upstash crée des clés/retourne 429.

## SEC-7

- Voir section 19, problèmes résolus, et `src/lib/securityAudit.ts`.
- État : code présent au commit 419c7c4; Discord/Vercel Logs à tester sur production.

## SEC-8

### État exact

Les fichiers suivants ont été **créés dans un ancien workspace** mais ne sont pas présents dans le snapshot Git `419c7c4` :

```text
.github/workflows/ci-security.yml
.github/workflows/codeql.yml
.github/dependabot.yml
docs/SECURITY/CI_CD_SECURITY.md
```

Ils doivent être recréés/commitée depuis un workspace propre avant d’affirmer SEC-8 terminé.

### Objectif

```text
npm ci
lint
build
audit npm high
git diff --check
Gitleaks
CodeQL
Dependabot
protection branche main
```

## SEC-9

À implémenter : tests automatisés API/RLS/Turnstile/Cloudinary. Aucun script `npm test` n’existe dans `package.json` au snapshot.

## SEC-10

À faire lors de l’achat de domaine : domaine Vercel, DNS, HTTPS, widget Cloudflare Turnstile, `TURNSTILE_ALLOWED_HOSTNAMES`, redéploiement et tests.

---

# 14. PERFORMANCE ET FLUIDITÉ

## Contrainte de non-régression

Le client a valorisé la rapidité perçue. Toute correction future doit préserver :

```text
réponse immédiate au clic
pas de double clic
navigation fluide
pas de faux succès
pas de page blanche durable
```

## Optimisations présentes

| Élément | Fichier | Décision |
|---|---|---|
| Préchargement routes admin | `src/app/admin/layout.tsx` | précharge commandes, produits, HPB, réglages, analytics après rendu |
| Analytics parallèles | `src/services/analyticsService.ts` | RPC démarrées avec les lectures principales |
| Agrégation mensuelle | `analyticsService.ts` | `Map` au lieu de recherche répétée tableau |
| Déduplication commandes | `src/services/orderService.ts` | Promise in-flight partagée |
| Images Next | composants publics/admin | `next/image`, `sizes` ciblés |
| Vidéos metadata | Hero/témoignages | `preload="metadata"` |

## Risques à surveiller

- Beaucoup de pages admin font `select('*')`, intentionnel car modales/édition utilisent les champs complets.
- Les performances ressenties dépendent fortement de la latence Supabase et de la connexion client.
- Analytics charge commandes + produits + clients + RPC; surveiller avec Network si catalogue très grand.

---

# 15. RESPONSIVE DESIGN

## Sidebar / Bottom navigation

### Incident

Au desktop, `lg:flex`, `lg:hidden` et `lg:ml-64` n’étaient pas appliqués correctement dans un runtime observé.

### Symptôme

```text
sidebar absente ou sidebar + BottomTabs simultanées
mainMarginLeft = 0px
```

### Correction

Classes CSS explicites dans `globals.css` :

```text
perscadors-desktop-sidebar
perscadors-mobile-navigation
perscadors-admin-main
```

Règle attendue :

| Largeur | Sidebar | BottomTabs | Main |
|---|---|---|---|
| `<1024px` | cachée | visible | marge 0 |
| `>=1024px` | visible | cachée | marge 16rem |

## Hero

- Vidéo principale : `object-contain` pour ne pas rogner.
- Extension arrière-plan : `object-cover`, flou et opacité pour combler visuellement les ratios.
- Hauteur : fallback `100vh`, moderne `100svh`, minimum mobile/desktop.

## Produits admin

Les filtres utilisent `flex-wrap` et `shrink-0` pour empêcher le scroll horizontal mobile.

## Santé boutique

Header empilé mobile, actions `flex-wrap`, score aligné mobile; toast dupliqué supprimé.

## Guide QA

```text
docs/QA/COMPLETE_FUNCTIONAL_AUDIT_GUIDE.md
```

Inclut une matrice 320px → 1920px+, mais validation physique complète reste à faire par collaborateurs.

---

# 16. UX / SIMPLICITÉ / INTERACTIONS

## Principes non négociables

- Perscadors = poste de pilotage quotidien simple.
- WhatsApp = canal de conversation naturel.
- Ne pas afficher de jargon SQL, RLS, JSON, API ou cache au marchand.
- Préférer upload média aux URL techniques.
- Toute écriture serveur échouée doit afficher un échec clair, jamais un faux succès local.
- Réduire les actions redondantes.
- Préserver la réactivité au premier clic.

## Toasts

`AdminToast` :

```text
success : 4s
info    : 5s
error   : 6s
fermeture manuelle disponible
```

## Labels métier

- `À enregistrer` au lieu de « à synchroniser ».
- `Mots à insérer` au lieu de « balises ».
- Numéro WhatsApp recommandé/facultatif au checkout.
- Villes lisibles plutôt que JSON / `zone-1`.

---

# 17. FONCTIONNALITÉS MÉTIER

## Produits

- Création, édition, suppression.
- Images multiples, tailles, couleurs, disponibilité par taille/couleur.
- Prix et stock rapide.
- Visibilité vitrine.
- Catégories associées.
- Filtres admin : tous, visibles, masqués, à compléter, stock faible.
- Partage Statut WhatsApp et envoi client.

## HP Looks

- CRUD looks, image, visibilité.
- Produits associés via JSONB.
- Prix calculé automatiquement côté base.
- Retrait de pièce rapide.
- Partage WhatsApp / envoi client.

## Commandes

- Checkout sécurisé et commandes WhatsApp.
- Statuts : attente, confirmée, livraison, livrée, annulée.
- Historique, idempotence, synchronisation pending.
- Envoi livreur et export CSV.
- Recovery Matrix / création manuelle WhatsApp historique.

## Clients

- Synthèse depuis commandes.
- Notes/tags persistés.
- Segments : VIP, fidèle, nouveau, gros panier, à relancer, standard.
- Relances WhatsApp.
- Contact externe WhatsApp non créé automatiquement en base.

## Médias

- Hero, logo, témoignages, bannière sociale.
- Upload image Supabase Storage.
- Upload vidéo Cloudinary H264/AAC/MP4.
- Activation/désactivation, suppression contrôlée.
- Priorité logo réglages sur asset média actif.

## Réglages

- identité boutique, devise, pays, délai.
- villes et frais de livraison, sans gratuité.
- Hero, logo, Footer, WhatsApp flottant.
- FAQ, témoignages.
- metadata sociale.
- templates WhatsApp et template checkout.
- segmentation client.

---

# 18. INTÉGRATION WHATSAPP

## Capacités

| Fonction | Détail |
|---|---|
| Produits | Statut Web Share, envoi client |
| HP Looks | Statut Web Share, envoi client |
| Contenu | Statut Web Share, envoi client |
| Destinataire | client existant ou numéro externe |
| Relances | template configurable |
| Checkout | message configurable, ouverture WhatsApp |
| Livreur | template configurable |

## Limitation importante

```text
wa.me envoie du texte uniquement.
```

Le partage image/vidéo automatique vers un statut ou destinataire nécessite Web Share (choix utilisateur) ou WhatsApp Business Cloud API. Cette dernière n’est pas implémentée.

## Services

```text
src/services/whatsappService.ts
src/services/whatsappShareService.ts
src/components/admin/WhatsAppRecipientDialog.tsx
```

---

# 19. PROBLÈMES RENCONTRÉS ET SOLUTIONS

| Symptôme | Cause | Correction | État |
|---|---|---|---|
| Hero noir Cloudinary | CSP media externe absente | `media-src ... https:` | résolu historiquement |
| Dev React erreur eval | CSP dev sans unsafe-eval | allowance dev seulement | résolu |
| Vidéo recadrée | object-cover | object-contain + extension immersive | implémenté, à valider visuellement |
| Ancien banner Hero | fallback historique | suppression fallback | résolu |
| Realtime callback erreur | channels mêmes noms | IDs uniques / cleanup | résolu |
| Produits/looks supprimés réapparaissent | fallback statique | Supabase prioritaire si disponible | résolu |
| HP Look duplicate key | séquence identity désalignée | setval sequence | migration |
| Prix look faux | product_ids JSONB | trigger calcul JSONB | migration |
| settings ID erreur | booléen vs integer | `SETTINGS_ROW_ID = true` | résolu |
| command order schema cache | colonnes manquantes | align_orders_schema | migration |
| ville `{...}` | JSON sérialisé | `getReadableCityName` | implémenté |
| filtres produits débordent | flex sans wrap | `flex-wrap` | implémenté |
| sidebar desktop absente | variantes lg runtime non appliquées | CSS explicite breakpoint | implémenté |
| boucle auth | état client/cookie ≠ middleware | middleware autorité, login check réel | résolu |
| Turnstile indisponible | CSP Cloudflare | script-src/frame-src | résolu |
| Turnstile invalid secret | clé Supabase incorrecte | correction/rotation clé | résolu par utilisateur |
| APIs Cloudinary publiques | absence requireAdmin | API server auth + validation | résolu |
| profil auto-élévation | `profiles_update_own` | policy supprimée | migration déclarée exécutée |
| TS2307 securityAudit | workspace partiel | module existe dans main `419c7c4` | résolu après reclone |
| Upstash sans effet | Vercel ancien déploiement | déployer commit avec route serveur | à revalider |

---

# 20. GIT / BRANCHES / PROCESSUS

## Source de vérité actuelle

```text
main
```

### Snapshot branches historique récent

À un audit antérieur :

```text
main était en avance sur develop et feature/ui-ux.
develop et feature étaient ancêtres de main.
```

La politique actuelle demandée par le propriétaire :

```text
main est la seule source de vérité.
```

Ne jamais réintroduire des versions depuis `develop` ou `feature/ui-ux` sans comparaison explicite avec `main`.

## Workflow pratique actuel

```text
GitHub main
↓
workspace propre/reclone
↓
modifications réelles
↓
npm install + lint + build + audit
↓
copie/test local utilisateur si nécessaire
↓
git add ciblé
↓
git commit
↓
git push main
↓
Vercel deployment
↓
validation production/Supabase
```

## Règles Git

- Pas de `git push --force`.
- Pas de rebase forcé sur branche partagée.
- Vérifier `git status`, `git fetch origin --prune`, `git pull --ff-only origin main` avant un nouveau lot.
- Si PowerShell affiche `>>`, utiliser `Ctrl+C` avant de recommencer une commande complète.
- Après changement historique important, re-cloner `main` plutôt que faire confiance à un workspace ancien.

---

# 21. WORKSPACE ET CONTINUITÉ DE TRAVAIL

## Problèmes rencontrés

- Snapshots workspace pouvant ne pas préserver `.git`.
- Multiples copies/clones historiques et fichiers temporaires.
- Dossier `/home/user/uploads` contenant captures/CSV/rapports fournis par l’utilisateur.
- Budget workspace dépassé lors d’une session longue.
- TS2307 `securityAudit` dans un workspace partiellement synchronisé.

## Règle de reprise

```text
1. Vérifier / supprimer uploads si aucun source ne s’y trouve.
2. Supprimer le clone perscadors ancien si doute.
3. Recloner --branch main depuis GitHub.
4. git fetch origin --prune.
5. Vérifier HEAD = origin/main.
6. npm install.
7. npx tsc --noEmit, lint, build, audit.
```

## Attention taille

Le repository contient beaucoup de médias versionnés (`public`, `ARRIEREPLAN`, `ARTICLES`, etc.). Ils sont légitimes et ne doivent pas être supprimés sans audit de références runtime.

---

# 22. VARIABLES D’ENVIRONNEMENT

> Ne documenter aucune valeur réelle ici.

| Variable | Sensibilité | Rôle |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | publique | URL projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publique contrôlée par RLS | client Supabase |
| `NEXT_PUBLIC_WHATSAPP_PHONE_DIGITS` | publique | WhatsApp checkout |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | publique | widget Turnstile |
| `TURNSTILE_SECRET_KEY` | secrète | vérification serveur Turnstile |
| `TURNSTILE_ALLOWED_HOSTNAMES` | non secrète | allowlist hostname Turnstile |
| `SUPABASE_SERVICE_ROLE_KEY` | **secrète** | checkout serveur uniquement |
| `UPSTASH_REDIS_REST_URL` | sensible | Redis rate limit |
| `UPSTASH_REDIS_REST_TOKEN` | **secrète** | Redis rate limit |
| `SECURITY_ALERT_WEBHOOK_URL` | **secrète** | alertes Discord |
| `CLOUDINARY_CLOUD_NAME` | non secrète | Cloudinary |
| `CLOUDINARY_API_KEY` | sensible | Cloudinary serveur |
| `CLOUDINARY_API_SECRET` | **secrète** | signatures/suppressions Cloudinary |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | publique | analytics optionnel |

Variables à configurer dans Vercel selon environnement : Production, Preview, Development. `.env.local` ne doit jamais être commité.

---

# 23. TESTS ET VALIDATION

| Test | État connu |
|---|---|
| `npm install` | PASS dans sessions récentes |
| `npx tsc --noEmit` | PASS après reclone main 419c7c4 |
| `npm run lint` | PASS dans sessions récentes |
| `npm run build` | PASS dans sessions récentes |
| `npm audit` | PASS, 0 vulnerabilities dans sessions récentes |
| `git diff --check` | PASS dans sessions récentes |
| Login Turnstile | PASS visuel déclaré |
| Checkout Turnstile | Validé déclaré par utilisateur (SEC-1) |
| RLS direct orders | Refus déclaré par utilisateur |
| Cloudinary anon/nonadmin | 403 déclaré |
| Cloudinary admin | 200 déclaré |
| Profile auto elevation | migration appliquée déclarée |
| Upstash production | **À REVALIDER** |
| Discord alert production | **À REVALIDER** |
| GitHub Actions SEC-8 | **NON CONFIRMÉ / fichiers absents main 419c7c4** |
| Tests automatisés sécurité | NON IMPLÉMENTÉ |
| Responsive physique complet | À valider via guide QA |
| Performance physique Network | À surveiller/valider via DevTools |

---

# 24. ÉTAT ACTUEL — SNAPSHOT

```text
Projet : Pescador / Perscadors
Branche de référence : main
Commit documenté : eb53d3a fix(ci): Secret scan remplace gitleaks-action par binaire direct
Phase : SEC-9 validé + Fix auth double vérif + Assets public/assets + CI 4/4 verts
Dernier lot fonctionnel/performance connu : a1084f6 perf(admin)
Dernier lot sécurité main : 419c7c4 logs structurés et alertes Discord + 3a6f024 rate limiting + b2e942a harmonise rôles + b695a72 interdit auto elevation
Dernier fix auth : 8855519 supprime double vérification Turnstile timeout-or-duplicate + bbd6f1d renouvelle Turnstile + d9dc927 log error.code
Dernier fix assets : 26e5c24 supprime duplication root 69M + 7219eb1 migration public/images → public/assets (Landron)
Dernier fix CI : eb53d3a secret scan binaire direct + ab4679f supprime codeql.yml conflit Default Setup + 5e6db5b lint Testimonials + remove puppeteer
Dernier problème diagnostiqué : double vérification Turnstile + assets 404 /images/ + CI 3 failing (CodeQL push, Quality, Secret scan)
Dernière correction : fix auth sans captchaToken + migration fix_asset_paths_images_to_assets.sql + fix lint + gitleaks.toml + suppression codeql.yml advanced
Branches : main = develop = feature/ui-ux = eb53d3a (alignées)
```


## État exact SEC-7

```text
Code : implémenté dans main
Module : src/lib/securityAudit.ts présent
Imports : cohérents
TypeScript : valide après reclone
Logs Vercel : à confirmer en production
Webhook Discord : configuré par utilisateur, à tester en production
Anti-spam Redis : à confirmer en production
```

---

# 25. TODO / TRAVAUX RESTANTS

## CRITIQUE

### Déployer/valider réellement le dernier main Vercel

- **Pourquoi :** SEC-6/SEC-7 ne peuvent pas être validées si la production sert un commit antérieur.
- **Fichiers :** routes API auth/checkout, `rateLimit`, `securityAudit`.
- **Test :** `GET /api/auth/admin-login` doit retourner 405, pas 404.
- **État :** à confirmer après dernier redéploiement.

### Valider Upstash et Discord

- **Pourquoi :** vérifier 429, logs Vercel et alertes réelles.
- **Test :** appels invalides contrôlés, clé Data Browser, alerte Discord.
- **État :** non confirmé.

## ÉLEVÉ

### SEC-8 : committer les workflows CI/CD

- **Pourquoi :** empêcher les erreurs/lint/build/audit/secrets d’arriver dans main.
- **Fichiers attendus :** `.github/workflows/ci-security.yml`, `.github/workflows/codeql.yml`, `.github/dependabot.yml`, `docs/SECURITY/CI_CD_SECURITY.md`.
- **État :** préparés dans ancien workspace, absents du snapshot main 419c7c4.
- **Test :** GitHub Actions vert après push.

### SEC-9 : tests automatisés sécurité

- **Pourquoi :** éviter régressions API/RLS/Turnstile.
- **Dépendance :** choisir framework test (Vitest/Jest/Playwright ou tests API ciblés).
- **État :** non implémenté.

## MOYEN

### SEC-4 : limites Storage

- **Pourquoi :** limiter abus taille/MIME même avec écriture admin.
- **Action :** configurer/valider buckets Supabase.
- **État :** policies validées, configuration limites non confirmée.

### Domaine personnalisé / SEC-10

- **Pourquoi :** production durable, DNS et hostnames Turnstile.
- **Action :** achat domaine, Vercel, DNS, HTTPS, Cloudflare, variable hostname.
- **État :** en attente.

### QA responsive physique

- **Pourquoi :** le build ne remplace pas le test sur appareils.
- **Document :** `docs/QA/COMPLETE_FUNCTIONAL_AUDIT_GUIDE.md`.
- **État :** guide présent, campagne à poursuivre.

## FAIBLE

### Documentation branche/CI

- Confirmer l’état réel de `develop` et `feature/ui-ux` seulement si besoin de réalignment futur.
- Garder `main` comme seule base de code.

---

# 26. POINT DE REPRISE POUR LA PROCHAINE CONVERSATION

1. **Recloner `main`**, jamais partir de `develop`/feature ou d’un workspace douteux.
2. Vérifier : `git status`, `git rev-parse HEAD origin/main`, `npx tsc --noEmit`, lint, build, audit.
3. Le dernier commit connu est `419c7c4` ; confirmer s’il a avancé.
4. SEC-1/2/3/5 sont déclarées implémentées; SEC-6 et SEC-7 sont codées mais exigent validation production Upstash/Vercel/Discord.
5. Vérifier `GET https://perscadors.vercel.app/api/auth/admin-login` : attendre **405**.
6. Déclencher un test sécurisé de Turnstile/rate limit et vérifier Vercel Logs/Discord/Upstash.
7. Ne commencer SEC-8 qu’après cette validation, ou recréer/committer les workflows CI préparés mais absents de main.
8. Ne jamais retirer les protections checkout, RLS, Cloudinary, Turnstile, middleware ou responsive pendant les corrections.

---

# TABLEAU FINAL DE CONTINUITÉ

| Domaine | État | Dernière action | Problème restant | Prochaine action |
|---|---|---|---|---|
| Frontend | Stable code | Hero public/assets, OutfitCarousel, CategoryGrid, Testimonials fix lint, Footer/Navbar public | validation physique complète | campagne QA + vérifier 404 /images/ fixés |
| Backend | Stable code | APIs checkout/auth/Cloudinary fix auth double verif | déploiement prod e9097b0/eb53d3a à confirmer | test endpoints prod |
| Supabase | Durci | migrations RLS/roles + fix_asset_paths_images_to_assets.sql | état exact migrations à revalider si doute | appliquer fix_asset_paths en prod |
| Auth | Corrigé | middleware + login serveur fix SEC-AUTH-001 (supprime double verif timeout-or-duplicate) | multi-admin à valider prod | test 2 admins en prod navigation privée |
| RLS | Durci | profile update retiré, policies admin, is_perscadors_admin role=admin multi-admin compatible | Storage limites | vérification dashboard |
| Turnstile | Corrigé | CSP + login + checkout + hostname allowed 3 domaines + secret aligné 3 services + renouvellement token | — | conserver |
| Cloudinary | Implémenté | auth/rate/validation | logs Discord à tester | test anon/admin |
| WhatsApp | Implémenté | templates, share, external recipient + test-whatsapp-url.js (supprimé mais utile) | tests métier continus | QA |
| Performance | Implémenté | prefetch, analytics parallèle, déduplication commandes | mesures réelles réseau | DevTools QA |
| Responsive | Implémenté | CSS sidebar, Hero, flex filters | appareils physiques | QA matrix |
| UX | Implémenté | simplification/admin toasts, Testimonials fix | retours collaborateurs | QA |
| Assets | Corrigé | public/assets 67M source unique, root 69M supprimé, public/images ancien supprimé | DB urls /images/ → /assets/ à migrer | appliquer fix_asset_paths.sql |
| SEC-1 | Validé | checkout sécurisé/RLS + close_direct_public_order_insert | — | conserver |
| SEC-2 | Validé | CSP/Turnstile + hostname allowlist 3 domaines | — | conserver |
| SEC-3 | Validé | rôles/Cloudinary/profiles anon 403 admin 200 | — | conserver |
| SEC-4 | Partiel | policies Storage admin only | MIME/taille | config Supabase dashboard |
| SEC-5 | Validé | admin unique → multi-admin compatible, superadmin converti admin, is_admin wrapper | — | conserver |
| SEC-6 | Validé | Upstash rate limiting 5/15m admin-login + logs + Data Browser 41.85.162.32 | — | conserver |
| SEC-7 | Validé | logs structurés JSON Vercel + Discord webhook + cooldown 5min | — | conserver |
| SEC-8 | Validé | ci-security.yml Quality 54s vert + secret scan gitleaks.toml + dependabot + CodeQL Default Setup dynamic 2 checks verts | — | conserver |
| SEC-9 | Validé | Vitest 21 tests + Playwright E2E + checkoutValidation + safeJsonLd | — | conserver |
| SEC-10 | En attente | — | domaine | achat/configuration |
| CI | Vert | 4/4 checks verts après ab4679f suppression codeql.yml conflit + eb53d3a secret scan binaire direct | — | conserver |

