# 04. AUTH SETUP — AUTHENTIFICATION ADMIN SÉCURISÉE

## STRATÉGIE SUPABASE AUTH POUR VIOUTOU
L'accès à l'interface d'administration `/admin` (incluant la gestion des médias, des looks et des stocks) doit être **strictement privé** et réservé à Vioutou et à ses gestionnaires accrédités.

### ÉTAPE 1 : CONFIGURATION DES PROVIDERS SUPABASE AUTH
1. Dans le tableau de bord Supabase, cliquez sur l'icône de cadenas **"Authentication"** dans la barre latérale gauche.
2. Cliquez sur l'onglet **"Providers"** dans le menu supérieur.
3. Assurez-vous que le provider **"Email"** est activé.
4. Dans la section *Email*, décochez **"Confirm email"** si vous souhaitez créer le compte de Vioutou directement sans passer par une étape de validation e-mail (pratique pour une mise en production rapide), ou configurez les gabarits d'envoi SMTP.
5. Cliquez sur **"Save"**.

### ÉTAPE 2 : CRÉATION DU COMPTE ADMINISTRATEUR PRINCIPAL
1. Toujours dans la section **"Authentication"**, cliquez sur l'onglet **"Users"** dans le menu supérieur.
2. Cliquez sur le bouton vert **"Add User"** > **"Create user"**.
3. **Email :** `admin@perscadors.com`
4. **Password :** `perscadors2024` (ou le mot de passe fort choisi par Vioutou).
5. Cliquez sur **"Create user"**.
6. Le compte apparaît dans la liste des utilisateurs avec un identifiant unique (UUID).

### ÉTAPE 3 : PERSISTANCE DES SESSIONS ET PROTECTION DES ROUTES
Le système d'authentification e-commerce est implémenté nativement dans `src/admin/auth.ts` et exploite les fonctionnalités avancées de Supabase Auth :
- **Login sécurisé :** Géré par le client Supabase `auth.signInWithPassword()`.
- **Session persistante :** Stockage sécurisé en cache local pour éviter à Vioutou de se reconnecter en permanence depuis son téléphone.
- **Protection des routes :** Chaque page sous `/admin/*` vérifie l'existence de la session via `useSyncExternalStore` et redirige automatiquement vers `/admin/login?redirect=...` si la session est expirée.
- **Déconnexion propre :** Bouton de déconnexion (`auth.signOut()`) accessible sur toutes les vues, purgeant immédiatement le cache de session.

### ÉTAPE 4 : TESTER LA CONNEXION
1. Lancez votre serveur local `npm run dev`.
2. Naviguez sur `http://localhost:3000/admin`.
3. Le système vous redirige automatiquement sur `http://localhost:3000/admin/login`.
4. Saisissez `admin@perscadors.com` et `perscadors2024`.
5. Validez. Vous êtes redirigé instantanément vers le tableau de bord d'administration.

---
**L'authentification est opérationnelle.** Passez au fichier `05_ENV_VARIABLES.md` pour lier votre code à Supabase.
