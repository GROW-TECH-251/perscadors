# RUNBOOK RELEASE — IMP-12 : QA finale + livraison Phase 2

> Release cible : **28/09/2026** · État de gel : `main` = `a0c5ae6` (release IMP-11) — IMP-01→11 intégrées.
> Ce document est la référence unique de la livraison. Ne rien merger après le gel sans repasser par ce runbook.

---

## 1. État de gel (vérifié le 30/08/2026)

| Élément | État | Preuve |
|---|---|---|
| feature/ui-ux | `4fe775b` (IMP-11) | `git ls-remote` |
| develop | `b55f24d` (merge IMP-11) | contient `4fe775b` |
| main | `a0c5ae6` (merge release IMP-11) | contient `4fe775b` |
| Build + lint (`npm run preprod:check`) | ✅ | compiled 999 ms, 21/21 pages, 0 erreur lint |
| Tests unitaires (`npm run test:unit`) | ✅ | **24 fichiers / 132 tests passed** |
| Dépendances (`npm audit`) | ✅ | 0 vulnérabilité |
| Hygiène code | ✅ | 0 `debugger`, 0 TODO/FIXME, 0 CSS mort (`.fade-in-scroll` supprimé IMP-11), 1 `console.log` justifié (bascule presse-papiers admin) |
| Migration SQL Supabase (vidéo produit) | ✅ exécutée | colonnes `video_url` / `video_public_id` (IMP-08) |

> Note roadmap : la validation « 57 tests » mentionnée initialement correspondait au compte Phase 1. Compte réel au gel : **132 unitaires + 7 tests E2E (14 exécutions : Desktop + Pixel 5)**.

## 2. À exécuter LOCALEMENT avant le go (obligatoire)

### 2.1 Tests E2E — 7 tests / 14 exécutions (4 responsive + 3 sécurité, × Desktop Chrome + Pixel 5)

> **Correctif FIX-E2E (30/08)** : les E2E échouaient en local pour deux causes environnementales, sans aucun défaut applicatif — (1) le dev server Turbopack compile la home à froid → timeout 30 s des premiers tests ; (2) `fullyParallel` × vidéo hero **4K 36 Mo autoplay** → `Page crashed` (mémoire). La config lance désormais un **build de production** et exécute les tests en **séquentiel** : 14/14 verts en ~15 s (vérifié). La page `/` n'a aucun débordement (scrollWidth = viewport, testé isolément).

```powershell
# Une seule fois : installer les navigateurs Playwright
npx playwright install

# Lancer — la config build puis démarre seule le serveur de production
# sur localhost:3000 (un serveur déjà lancé sur :3000 est réutilisé)
npm run test:e2e

# OU la chaîne complète (unitaires + E2E)
npm run test
```

☐ 14/14 exécutions E2E vertes (0 flaky — sinon relancer une fois et noter l'échec résiduel)

### 2.1 bis — Recommandation vidéo hero (fort gain Lighthouse, à faire localement)

La vidéo hero (`public/assets/backgrounds/7679830-uhd_4096_2160_25fps.mp4`) pèse **36 Mo en 4K** : c'est le principal risque pour le seuil Lighthouse mobile ≥ 85 (§2.2) et pour les données mobiles des visiteurs. Recommandation (optionnel, hors patch — fichier binaire) : produire une version 1080p (~3-6 Mo) et remplacer le fichier :

```powershell
# Avec ffmpeg installé localement (https://ffmpeg.org) :
ffmpeg -i public/assets/backgrounds/7679830-uhd_4096_2160_25fps.mp4 -vf scale=-2:1080 -r 25 -c:v libx264 -crf 23 -preset slow -an public/assets/backgrounds/hero-1080p.mp4
# puis remplacer l'ancien fichier par le nouveau (même nom ou mise à jour du réglage hero_video_url dans l'admin)
```

☐ Vidéo hero recompressée (recommandé avant Lighthouse §2.2)

### 2.2 Lighthouse mobile ≥ 85

Procédure détaillée : `docs/QA/CHECKLIST_IMP11.md` §1 (pages `/`, `/catalogue`, `/produit/[id]`, `/looks`).

☐ Perf mobile ≥ 85 sur `/` · ☐ scores notés dans le tableau de la checklist IMP-11

### 2.3 Parcours client complet (desktop ET mobile 375 px)

☐ Home → hero vidéo (poster visible, vidéo jouable) → marquee → carousel outfits (drag + modal Look : Tab piégé, Escape, « Recréer ce look » → badge panier +N)
☐ Catalogue → filtres catégorie → fiche produit : swipe galerie, lightbox (zoom au point cliqué, compteur, flèches/Escape), vidéo (tuile ▶, lecteur in-page SANS autoplay, lightbox vidéo)
☐ Sélection taille/couleur → ajout panier → checkout complet → commande WhatsApp créée
☐ `/looks` : inspection + WhatsApp
☐ Reduced-motion OS activé : aucune animation partout (§2 checklist IMP-11)

### 2.4 Parcours admin complet (desktop ET mobile)

☐ Login admin (Turnstile) → dashboard
☐ Produits : création (image + vidéo ≤ 30 Mo), édition, visibilité, suppression vidéo (confirmation)
☐ Commandes : confirmation → expédition WhatsApp
☐ Analytics : KPI animés, tooltips sombres/or, export CSV (contenu inchangé), « Décisions du jour »
☐ Stock / clients / catégories / contenu / réglages : ouverture sans erreur

### 2.5 Décisions pendantes

☐ Contrastes §4 checklist IMP-11 : option A (conforme AA) ou B (statu quo) — **acter**
☐ Tag de version : recommandé `v1.1.0` (fin de Phase 2, montée mineure) — optionnel

## 3. Critères GO / NO-GO

**GO si :** 132 unitaires ✅ + 55 E2E ✅ + Lighthouse ≥ 85 ✅ + parcours 2.3/2.4 sans blocage ✅ + aucune erreur console majeure.
**NO-GO sinon :** documenter l'écart dans ce fichier (section 5), fixer sur feature/ui-ux, re-exécuter §2, puis GO.

## 4. Circuit Git de release (après GO)

```powershell
# 0) Vérifications préalables
git status
git branch --show-current            # feature/ui-ux
git fetch origin
git log --oneline -1 origin/feature/ui-ux   # commit runbook IMP-12 attendu

# 1) Intégration develop (convention observée : "merge: IMP-12")
git checkout develop
git pull origin develop
git merge feature/ui-ux
# vérifier : aucun conflit attendu (1 fichier docs)
git push origin develop

# 2) Release main (convention observée : "merge: release IMP-12")
git checkout main
git pull origin main
git merge feature/ui-ux
git push origin main

# 3) Tag optionnel (recommandé, sur main)
git tag -a v1.1.0 -m "Phase 2 — experience digitale premium : IMP-01..IMP-12 (tokens, micro-interactions, navbar, hero, scroll reveal, storytelling, galerie lightbox, video produit, modal look, analytics polish, QA/a11y/SEO)"
git push origin v1.1.0

# 4) Déploiement
# Si Vercel est connecté à main : déploiement automatique — vérifier le dashboard Vercel
# (statut "Ready"), puis re-exécuter 2.3/2.4 sur l'URL de production.
```

## 5. Retour arrière

- **Code** : `git revert -m 1 <merge-commit>` sur main (ou re-déploiement du tag précédent). Aucun tag antérieur n'existe → le SHA de référence pré-Phase 2 est consultable dans l'historique main.
- **Base** : les colonnes SQL IMP-08 sont additives et inoffensives si le code est revenu (aucune action requise).
- **Validation post-rollback** : re-exécuter §2.1 + parcours 2.3 sur la version rétablie.

## 6. Journal de release

| Date | Étape | Résultat |
|---|---|---|
| 30/08/2026 | Gel + validations workspace | ✅ build/lint/132 tests/audit (section 1) |
| ____ | E2E locaux (55) | ☐ |
| ____ | Lighthouse mobile | ☐ |
| ____ | Parcours client + admin | ☐ |
| ____ | GO acté par : ________ | ☐ |
| 28/09/2026 | Merge release main + tag + déploiement | ☐ |
