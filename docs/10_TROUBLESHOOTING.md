# 10. TROUBLESHOOTING — GUIDE DE DÉPANNAGE AVANCÉ

## RÉSOLUTIONS DES ANOMALIES COURANTES ET ARCHITECTURE DE SECOURS
Ce document est le manuel d'urgence du Lead Architect pour diagnostiquer et résoudre les éventuels incidents de synchronisation de la plateforme Perscadors.

### 1. ERREUR SUPABASE `PGRST204` / `PGRST205` (Table ou colonne absente)
* **Symptôme :** Lors de l'enregistrement de réglages ou du chargement de la table `site_assets`, la console logue `Could not find the table 'public.site_assets' in the schema cache` ou un message similaire.
* **Cause :** La table ou une colonne n'a pas été créée en base de données, ou le cache de schéma Supabase n'est pas actualisé.
* **Solution de niveau 1 (Immédiate) :** L'application implémente un système de repli silencieux en mémoire et `localStorage`. L'erreur est ignorée et la vitrine affiche son contenu de secours.
* **Solution de niveau 2 (Durable) :** Ouvrez le tableau de bord Supabase > SQL Editor > Exécutez le script du document `03_DATABASE_SETUP.md`, puis videz le cache REST via la commande SQL : `NOTIFY pgrst, 'reload schema';`.

### 2. ERREURS DE CLÉS DUPLIQUÉES TURBOPACK (`Encountered two children with the same key, '1'`)
* **Symptôme :** Turbopack logue 18 issues en rouge et le rendu React est saccadé.
* **Cause :** Anciennement, la fonction d'auto-seeding écrasait les identifiants textuels (`basket-1`) en un chiffre unique (`1`).
* **Solution :** Ce problème a été intégralement purgé en adoptant une incrémentation de clés strictes (`'1'`, `'2'`, `'3'`) et des clés JSX composées (`key={\`product-\${product.id}-\${index}\`}`). Si vous importez un nouveau lot de données brutes, assurez-vous que `product.id` est une chaîne numérique unique.

### 3. HYDRATION MISMATCH (Compteur de panier ou Login page)
* **Symptôme :** `Uncaught Error: Hydration failed because the server rendered HTML didn't match the client`.
* **Cause :** Lecture synchrone de `window.localStorage` ou `window.location.search` pendant le premier cycle de rendu sur un composant SSR.
* **Solution :** Toujours conditionner l'affichage des éléments liés au stockage local par un état asynchrone `isMounted`, activé dans un `useEffect` encapsulé par un `setTimeout(..., 0)` (pour respecter la règle ESLint `react-hooks/set-state-in-effect`).

### 4. ERREUR `Warning: validateDOMNesting: <main> cannot appear as a descendant of <main>`
* **Symptôme :** Avertissement dans la console du terminal VS Code.
* **Cause :** Imbrication d'une balise `<main>` dans `PublicLayout.tsx` sous celle de `RootLayout`.
* **Solution :** `PublicLayout.tsx` utilise dorénavant un conteneur `<div className="w-full">`. Ne jamais réintroduire de balise `<main>` dans les sous-layouts.

### 5. IMPOSSIBLE D'UPLOADER UNE VIDÉO OU IMAGE (Erreur Storage)
* **Symptôme :** Message "Erreur d'upload du fichier" dans la modale `/admin/media`.
* **Cause :** Le bucket `site-assets` n'est pas défini sur "Public" ou les polices RLS interdisent l'écriture.
* **Solution :** Vérifiez que vous êtes connecté en tant que `admin@perscadors.com` et exécutez le script de polices du document `08_STORAGE_POLICIES.md`.

---
**Votre manuel de dépannage est complet.** Votre architecture e-commerce est parée à toute éventualité.
