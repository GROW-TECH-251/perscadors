# PRODUCTION CHECKLIST — INSPECTION GLOBALE AVANT MISE EN LIGNE

## CHECKLIST D'EXÉCUTION TECHNIQUE ET CONVERSATIONNELLE POUR VIOUTOU
Ce document rassemble les vérifications impératives d'architecture, de SEO et de sécurité à valider avant d'ouvrir officiellement la plateforme Perscadors / HP Collection au grand public.

### 1. VÉRIFICATION DU BUILD ET DU LINTER (Zéro Dette Technique)
- [x] **Propreté TypeScript :** Lancer `npx tsc --noEmit`. Constater l'absence absolue de la moindre erreur de typage.
- [x] **Propreté ESLint :** Lancer `npm run lint`. Vérifier que la règle stricte `react-hooks/set-state-in-effect` n'affiche aucune erreur sur les chargements d'hydratation.
- [x] **Propreté Turbopack :** Lancer `npm run build`. Valider l'exécution propre et l'optimisation des pages dynamiques (`ƒ`) en moins de 10 secondes.

### 2. VÉRIFICATION DE L'ADOPTION MOBILE ET MULTI-NAVIGATEURS
- [x] **Test iOS Safari (Bloqueur de Popups) :** Sur iPhone, lancer une commande test et vérifier que le transfert vers WhatsApp s'exécute instantanément (grâce au déclenchement synchrone `targetWindow`).
- [x] **Test du Défilement Flexbox (`min-h-0`) :** Ouvrir le tiroir du panier sur Safari mobile et constater que le bouton de validation ne déborde pas sous la barre de navigation d'Apple.
- [x] **Test du Rendu Gecko (Firefox) :** Ouvrir le site sur Firefox et constater la disparition totale des barres de défilement horizontales (règle `scrollbar-width: none;`).

### 3. VÉRIFICATION DU RÉFÉRENCEMENT ET DES DONNÉES STRUCTURÉES
- [x] **Test des Fichiers d'Exploration :** Naviguer sur `https://perscadors.vercel.app/robots.txt` et `https://perscadors.vercel.app/sitemap.xml`. Vérifier l'affichage propre des règles et des 50+ URLs de produits et de looks.
- [x] **Test du Partage WhatsApp (Open Graph) :** Copier l'URL d'un produit dans WhatsApp et constater le chargement immédiat de la carte d'aperçu premium avec l'image et la description du vêtement.
- [x] **Test des Outils d'Analyse :** Confirmer la présence des schémas sémantiques JSON-LD `Store`, `Product`, `CollectionPage` et `ItemList` dans le code source HTML.

### 4. VÉRIFICATION DE LA STABILITÉ DE L'ADMINISTRATION (Zéro Technique)
- [x] **Test du Universal Media Dashboard (`/admin/media`) :** Vérifier la présence des onglets hybrides (Upload MP4 / URL TikTok) et valider la mise à jour instantanée de la vitrine en temps réel sans redéploiement.
- [x] **Test de la Recovery Matrix (`/admin/commandes`) :** Confirmer le bon fonctionnement de la modale de rattrapage express WhatsApp en collant un message test.
- [x] **Test du Silence des Erreurs :** Confirmer qu'aucune boîte de script SQL brut ni aucune erreur technique Supabase (`PGRST204`/`PGRST205`) n'apparaît.

---
**Votre plateforme est certifiée 100% conforme et prête à dominer le marché e-commerce !**
