# CHECKLIST QA — IMP-11 : Design QA + Accessibilité + Garde SEO

> Audit transverse final de IMP-01 → IMP-10, avant release IMP-12 (28/09/2026).
> À exécuter localement sur `feature/ui-ux` à jour. Cocher uniquement ce qui est vérifié dans le navigateur.

---

## 1. Lighthouse mobile ≥ 85 (seuil de validation IMP-11)

**Procédure (Chrome, mode navigation privée pour éviter les extensions) :**

1. `npm run build && npm run start` (production local, pas le mode dev)
2. Ouvrir `http://localhost:3000` → DevTools (F12) → onglet **Lighthouse**
3. Catégories : Performance + Accessibilité + Bonnes pratiques + SEO · **Mobile** · Apply
4. Répéter pour les pages clés : `/`, `/catalogue`, `/produit/[id]` (produit avec image + vidéo si disponible), `/looks`
5. Noter les scores dans le tableau ci-dessous — **seuil : Performance mobile ≥ 85 sur `/`**

| Page | Perf | A11y | BP | SEO |
|---|---|---|---|---|
| `/` | ☐ | ☐ | ☐ | ☐ |
| `/catalogue` | ☐ | ☐ | ☐ | ☐ |
| `/produit/[id]` | ☐ | ☐ | ☐ | ☐ |
| `/looks` | ☐ | ☐ | ☐ | ☐ |

*Alternative CLI : `npx lighthouse http://localhost:3000 --preset=desktop=false --form-factor=mobile --screenEmulation.mobile --view`*

---

## 2. Réduction de mouvement (prefers-reduced-motion = la loi)

☐ OS « Animer » désactivé (Windows : Paramètres > Accessibilité > Effets visuels ; macOS : Réduire le mouvement)
☐ Accueil : hero vidéo figée sur le poster, marquee arrêté, aucun parallax
☐ Carousel outfits : défilement automatique arrêté (navigation manuelle uniquement)
☐ Fiche produit : lightbox s'ouvre/ferme sans fondu, zoom instantané, pas de compteur animé
☐ Vidéo produit : lightbox vidéo SANS lecture automatique
☐ `/looks` + Modal Look : apparition/disparition sans animation
☐ Admin analytics : KPI affichés directement à leur valeur (pas de comptage)

## 3. Clavier & focus

☐ `Tab` traverse : navbar → contenu → footer dans l'ordre logique (toutes pages)
☐ Anneau de focus **or visible** (3 px) sur chaque élément interactif (liens, boutons, cartes, vignettes, croix)
☐ Navbar mobile : ouverture/fermeture au clavier, `Escape` si focus dans le panneau
☐ Fiche produit : miniatures + sélecteurs taille/couleur + quantité opérables au clavier
☐ Lightbox IMP-07 : `Escape` ferme, `←`/`→` naviguent, focus initial sur la croix
☐ Modal Look IMP-09 : `Tab` reste piégé dans le modal, `Escape` ferme, focus rendu à la carte d'origine
☐ Checkout : parcours complet (panier → coordonnées → confirmation) sans souris

## 4. Contrastres WCAG (findings audit — décision à valider)

| Pair | Ratio mesuré | Seuil AA | Verdict |
|---|---|---|---|
| `#0A0A0A` sur `#F5F0E8` (texte principal) | ≈ 17,5:1 | 4,5:1 | ✅ AAA |
| `#B8952A` (or) sur `#0A0A0A` (navbar/hero sombres) | ≈ 7,0:1 | 4,5:1 | ✅ AA |
| `#888880` (texte muted) sur `#F5F0E8` | ≈ 3,2:1 | 4,5:1 | ⚠️ **Écart** — passe en grand texte (3:1) uniquement |
| `#B8952A` (or) sur `#F5F0E8` (accents sur fond clair) | ≈ 2,5:1 | 3:1 | ⚠️ **Écart** — à réserver aux grands titres/décor |

**Décision à prendre (marque) — recommandations, NON appliquées en IMP-11 (aucune refonte) :**
- Option A (conforme AA, look légèrement plus sombre) : `--color-brand-text-muted: #6B6B63` (≈ 4,9:1) + réserver l'or-texte aux fonds sombres, utiliser `#8A6D1F` pour l'or-texte petit corps sur fond clair (≈ 4,6:1).
- Option B (statu quo assumé) : conserver la palette, documenter la dérogation (grande taille/uppercase bebas majoritaire).
☐ Décision actée : ________

## 5. SEO — aucune régression

☐ `view-source:` sur `/produit/[id]` : `<title>` + `meta description` spécifiques au produit dans le HTML initial
☐ `view-source:` sur `/looks` : title/description dynamiques présents
☐ JSON-LD produit : `application/ld+json` avec `@type: Product`, `offers` (XOF), `availability` — et `subjectOf: VideoObject` avec `uploadDate` si le produit a une vidéo
☐ `/sitemap.xml` répond ; `/robots.txt` n'interdit rien d'inattendu
☐ Aucune régression d'images : `next/image` partout (pas de `<img>` brut ajouté)
☐ Search Console : aucun motif d'exclusion nouveau après déploiement

## 6. Parcours visuels rapides IMP-01 → IMP-10

☐ IMP-01 : typographie fluide (hero agrandi entre 375 px et desktop, jamais coupé)
☐ IMP-02 : micro-feedback sur boutons/liens (hover discret, tokens)
☐ IMP-03 : navbar premium desktop + mobile (panneau animé)
☐ IMP-04 : hero vidéo avec poster + fallback si vidéo lente/absente
☐ IMP-05 : sections qui se révèlent au scroll (et PAS animées sous reduced-motion)
☐ IMP-06 : marquee éditorial + stats catalogue
☐ IMP-07 : galerie produit — swipe in-page, lightbox zoom au point cliqué, compteur
☐ IMP-08 : tuile vidéo en fin de galerie, lecteur in-page sans autoplay, lightbox vidéo
☐ IMP-09 : modal Look accessible, pièces cliquables, feedback « ✓ ajouté », WhatsApp
☐ IMP-10 : KPI animés, tooltips sombres/or, états vides structurés (compte de test vide)

## 7. Responsive (points de rupture à parcourir en mode appareil : 375 / 768 / 1024 / 1440)

☐ Aucun débordement horizontal (`overflow-x`) sur aucune page
☐ Grilles produits/looks : 1 → 2 → 3 colonnes sans chevauchement
☐ Lightbox/Modal Look utilisables à 375 px (boutons atteignables, texte lisible)

## 8. Rollback

- Code : `git revert HEAD` sur `feature/ui-ux` (6 fichiers IMP-11, aucun changement visuel attendu).
- Le champ `createdAt`/`uploadDate` est additif : sans risque si retiré.

---

*Résultat de l'audit automatisable (workspace) : reduced-motion global `*` ✅ · focus-visible or ✅ · `lang="fr"` ✅ · sitemap+robots ✅ · metadata exports ✅ · tokens IMP-01 ✅ · CSS mort supprimé ✅ — verrouillés par `tests/unit/qaDesign.test.ts`.*
