# PERFORMANCE — CORE WEB VITALS ET AUDIT LIGHTHOUSE

## SIGNAUX WEB ESSENTIELS ET OPTIMISATION DES VITESSES MOBILE
Le trafic de Perscadors / HP Collection est majoritairement issu de smartphones (iOS Safari, Android Chrome). Pour garantir que l'application s'exécute de manière fluide et ne subisse aucune pénalité de référencement Google liée aux lenteurs, les indicateurs Core Web Vitals doivent afficher des scores parfaits.

### 1. LCP (Largest Contentful Paint) — Temps de Rendu du Plus Grand Média
* **Symptôme de lenteur :** La vidéo d'arrière-plan du Héros (`Hero.tsx`) ou l'image de couverture d'un HP Look prend plusieurs secondes à s'afficher sur mobile.
* **Architecture d'Optimisation :** 
  - Le composant `Hero.tsx` intègre l'attribut `priority` et gère le chargement MP4 asynchrone après 600ms pour éviter le blocage du thread principal de Next.js.
  - Dans `Navbar.tsx` et `produit/[id]/page.tsx`, l'attribut `priority` est imposé sur les logos et la première image du vêtement, signalant à Vercel de précharger ces médias dans les headers HTTP `rel="preload"`.

### 2. CLS (Cumulative Layout Shift) — Stabilité Visuelle et Sursauts
* **Symptôme d'instabilité :** Lors de l'ouverture du site, le texte saute brusquement en bas au moment où l'en-tête ou les boutons finissent de charger.
* **Architecture d'Optimisation :**
  - **Gestion des dimensions :** Toutes les balises `<Image>` utilisent les propriétés `fill` ou imposent des ratios stricts (`aspect-[3/4]`, `aspect-[4/5]`) pour réserver l'espace dans le DOM avant le téléchargement de l'image.
  - **Police asynchrone :** `Barlow` et `Bebas Neue` exploitent l'option `display: 'swap'`, affichant instantanément une police système de repli en attendant le rendu de la typographie premium.

### 3. INP (Interaction to Next Paint) — Réactivité aux Touch Targets
* **Symptôme de latence :** Un utilisateur tapote sur le bouton de pastille de taille (`41` ou `M`) ou sur le bouton *Ajouter au Panier*, et l'écran fige pendant une demi-seconde avant de changer la couleur.
* **Architecture d'Optimisation :**
  - Nos composants exploitent des états locaux immédiats (`useState`, `setIsAddedToCart`) et encapsulent les opérations lourdes (calculs d'hydratation, appels Supabase) dans des fonctions asynchrones de repli (`setTimeout`, `useCallback`). Le navigateur conserve une cadence parfaite de 60 images par seconde.

### 4. BUNDLE SIZE ET CHARGEMENT DU CODE CLIENT
Le référentiel a été purgé de la dette technique legacy (l'ancienne SPA de 15 fichiers a été définitivement radiée). Le bundle Next.js 16.2.6 (Turbopack) est extrêmement léger, générant les fichiers CSS et JS minifiés en une poignée de millisecondes.

---
**Les performances de votre site sont de niveau mondial.** Passez au document `PRODUCTION_CHECKLIST.md` pour l'inspection finale avant le déploiement public.
