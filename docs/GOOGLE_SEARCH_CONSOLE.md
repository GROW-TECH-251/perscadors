# GOOGLE SEARCH CONSOLE — INDEXATION ET SUIVI DE PERFORMANCE

## PARAMÉTRAGE OFFICIEL DE LA PROPRIÉTÉ SUR GOOGLE SEARCH CONSOLE
Ce document liste la procédure pas-à-pas pour associer la plateforme Perscadors / HP Collection à Google Search Console et y soumettre le plan du site.

### ÉTAPE 1 : AJOUT DE LA PROPRIÉTÉ
1. Connectez-vous à [search.google.com/search-console](https://search.google.com/search-console).
2. Cliquez sur **"Ajouter une propriété"** dans le volet gauche.
3. Deux choix s'offrent à vous :
   - **Propriété de Domaine :** Si vous possédez le nom de domaine racine (ex: `hpcollection.bj`). Dans ce cas, vous devrez valider par un enregistrement TXT dans vos DNS.
   - **Préfixe de l'URL :** Recommandé si vous conservez le déploiement Vercel. Saisissez exactement `https://perscadors.vercel.app/`.

### ÉTAPE 2 : VALIDATION DE LA PROPRIÉTÉ (Méthode Vercel)
Si vous utilisez l'option *Préfixe de l'URL*, sélectionnez la méthode de validation **Balise HTML** (`<meta name="google-site-verification" content="..." />`).
1. Copiez l'attribut `content`.
2. Dans `src/app/layout.tsx`, vous pouvez l'ajouter au sein de l'objet metadata : `verification: { google: 'votre_code_ici' }`.
3. Redéployez sur Vercel et cliquez sur **"Valider"** dans la Search Console.

### ÉTAPE 3 : SOUMISSION DU SITEMAP DYNAMIQUE
1. Dans le tableau de bord de la Search Console, cliquez sur **"Sitemaps"** dans le menu gauche.
2. Dans le champ *Ajouter un sitemap*, saisissez exactement `sitemap.xml` (qui sera résolu par Next.js via le générateur `src/app/sitemap.ts`).
3. Cliquez sur **"Envoyer"**.
4. Vérifiez que le statut indique **"Opération effectuée"** avec la détection de la cinquantaine d'URLs dynamiques (19 produits + 32 looks + catégories + accueil).

### ÉTAPE 4 : AUDIT DE DÉCOUVRABILITÉ ET RAPPORT D'INDEXATION
- **Inspection d'URL :** Entrez l'URL d'un produit (ex: `https://perscadors.vercel.app/produit/1`) dans la barre supérieure de la Search Console pour vérifier que Googlebot parvient à y lire les données structurées JSON-LD `Product`.
- **Rapport sur les extraits enrichis (Rich Results) :** La console vous notifiera automatiquement de la présence des extraits e-commerce (avis, prix en XOF, disponibilité).

---
**Votre Search Console est active.** Passez au document `GOOGLE_ANALYTICS.md` pour le suivi des conversions.
