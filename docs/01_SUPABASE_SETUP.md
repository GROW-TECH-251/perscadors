# 01. SUPABASE SETUP — CONFIGURATION DE L'ESPACE DE TRAVAIL

## ARCHITECTURE DE BASE & ESPACE DE TRAVAIL
Ce document décrit la procédure officielle pas-à-pas pour configurer le projet Supabase dédié à la plateforme e-commerce premium **Perscadors / HP Collection** de Vioutou.

### ÉTAPE 1 : CRÉATION DU PROJET
1. Connectez-vous à votre tableau de bord Supabase sur [supabase.com](https://supabase.com).
2. Cliquez sur le bouton vert **"New Project"**.
3. Sélectionnez votre organisation (ou créez-en une au nom de *HP Collection*).
4. **Project Name :** `perscadors-production`.
5. **Database Password :** Générez un mot de passe ultra-sécurisé (minimum 32 caractères) et stockez-le immédiatement dans votre gestionnaire de mots de passe.
6. **Region :** Sélectionnez la région la plus proche de vos utilisateurs principaux (ex: `eu-central-1` pour une faible latence Europe/Afrique de l'Ouest).
7. Cliquez sur **"Create new project"**. Le déploiement du cluster PostgreSQL prend environ 2 à 3 minutes.

### ÉTAPE 2 : RÉCUPÉRATION DES CLÉS D'ACCÈS
1. Une fois le projet prêt, naviguez dans le menu latéral gauche et cliquez sur l'icône d'engrenage **"Project Settings"**.
2. Sélectionnez l'onglet **"API"**.
3. Repérez la section **"Project URL"**. Copiez l'URL (ex: `https://xxxxxx.supabase.co`).
4. Repérez la section **"Project API keys"**. Copiez la clé **`anon` / `public`**.
5. Copiez également la clé **`service_role`** (attention : cette clé donne un accès total en écriture/lecture en outrepassant les polices RLS, à garder strictement confidentielle).

### ÉTAPE 3 : VÉRIFICATION DU SSL ET PROTOCOLE
1. Assurez-vous que l'accès HTTPS est activé par défaut.
2. Dans la section **"Database"** des paramètres, notez le *Connection string* (URI) pour les éventuelles connexions directes via Prisma ou des outils de migration avancés.

---
**Félicitations !** Votre instance Supabase est opérationnelle. Passez au fichier `02_STORAGE_SETUP.md` pour initialiser la structure des fichiers.
