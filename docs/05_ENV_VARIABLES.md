# 05. ENV VARIABLES — VARIABLES D'ENVIRONNEMENT

## CONNEXION DE L'APPLICATION NEXT.JS AU BACKEND SUPABASE
Pour que l'application Next.js puisse interagir avec vos buckets Storage et votre table `site_assets`, les clés d'API doivent être injectées dans vos variables d'environnement.

### ÉTAPE 1 : FICHIER LOCAL `.env.local`
1. Dans le dossier racine de votre projet (`perscadors/`), créez ou modifiez un fichier nommé **`.env.local`**.
2. Saisissez exactement les deux variables obligatoires suivantes en remplaçant par vos valeurs récupérées à l'étape 01 :

```text
# ==========================================
# VARIABLES D'ENVIRONNEMENT SUPABASE (Obligatoire)
# ==========================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxx.xxxxxx

# ==========================================
# CLÉ DE CONTOURNEMENT ADMIN (Optionnelle / Dépannage)
# ==========================================
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxx.xxxxxx
```

### ÉTAPE 2 : EXPLICATION DES VARIABLES
- **`NEXT_PUBLIC_SUPABASE_URL` :** L'URL racine de votre cluster Supabase. Indispensable pour la génération des URLs publiques de stockage (`site-assets`).
- **`NEXT_PUBLIC_SUPABASE_ANON_KEY` :** La clé anonyme sécurisée. C'est la clé embarquée côté Next.js (client & SSR) pour communiquer avec Supabase Auth et Storage.
- **`SUPABASE_SERVICE_ROLE_KEY` :** (Non exposée au navigateur). Optionnelle, à utiliser exclusivement dans des environnements serveurs node purs ou scripts de migration.

### ÉTAPE 3 : CONFIGURATION SUR VERCEL (Mise en production)
Lorsque vous déploierez l'application sur Vercel, vous devrez renseigner ces mêmes variables dans les paramètres du projet :
1. Sur le tableau de bord Vercel, ouvrez votre projet `perscadors`.
2. Allez dans l'onglet **"Settings"** > **"Environment Variables"**.
3. Copiez-collez les deux clés `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Cliquez sur **"Save"**.

### ÉTAPE 4 : ARCHITECTURE DE REPLI (Fallback en l'absence de variables)
Conformément aux règles d'architecture Perscadors, si ces variables sont absentes (ex: test en local sur une machine vierge), l'application ne plante **jamais**. Le système bascule automatiquement sur les mock-ups statiques et le cache `localStorage` pour assurer une vitrine 100% fonctionnelle.

---
**Vos variables sont en place.** Passez au fichier `06_ADMIN_SYSTEM.md` pour découvrir la philosophie du tableau de bord.
