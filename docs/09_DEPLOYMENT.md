# 09. DEPLOYMENT — DÉPLOIEMENT EN PRODUCTION SUR VERCEL

## STRATÉGIE DE DÉPLOIEMENT NEXT.JS 16.2 (Turbopack)
Ce document regroupe les étapes officielles pour déployer ou mettre à jour la plateforme Perscadors / HP Collection sur Vercel.

### ÉTAPE 1 : IMPORT DU DÉPÔT GITHUB
1. Connectez-vous à votre tableau de bord sur [vercel.com](https://vercel.com).
2. Cliquez sur **"Add New"** > **"Project"**.
3. Sélectionnez le dépôt d'origine : `https://github.com/GROW-TECH-251/perscadors.git`.
4. Cliquez sur **"Import"**.

### ÉTAPE 2 : CONFIGURATION DU FRAMEWORK ET DES ENVIRONNEMENTS
1. **Framework Preset :** Vercel détectera automatiquement **Next.js**. Laissez cette configuration par défaut.
2. **Root Directory :** Laissez sur la racine (`./`).
3. **Environment Variables :** Ouvrez l'accordéon et saisissez les deux variables Supabase recensées dans le document `05_ENV_VARIABLES.md` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Cliquez sur **"Deploy"**.

### ÉTAPE 3 : GESTION DU BUILD ET DE L'ÉCHEC INITIAL
Le build de production Next.js 16.2 (`npm run build`) procède à la vérification stricte du typage TypeScript et de la validité du DOM.
- Grâce à la purge totale des exclusions `tsconfig.json` et à la résolution des erreurs de clés dupliquées, le build passe en production en moins de 15 secondes.
- L'intégralité des routes est certifiée dynamique (`ƒ`) grâce aux directives `export const dynamic = 'force-dynamic'; export const revalidate = 0;` imposées dans `src/app/page.tsx` et `src/app/layout.tsx`.

### ÉTAPE 4 : MIGRATIONS ET SYNCHRONISATION INSTANTANÉE
Grâce à notre **Universal Media Dashboard** et à la persistance hybride Supabase/localStorage :
- Vioutou n'a **plus jamais** besoin de relancer un déploiement Vercel ou de faire un commit GitHub pour changer une photo, une vidéo, ou modifier les réglages de la vitrine.
- Chaque mise à jour sur `/admin/media` est immédiatement visible sur le domaine principal `perscadors.vercel.app` en temps réel.

---
**Votre plateforme est en ligne.** Passez au fichier `10_TROUBLESHOOTING.md` pour les procédures de dépannage avancées.
