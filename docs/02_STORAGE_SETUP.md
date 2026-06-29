# 02. STORAGE SETUP — ARCHITECTURE SUPABASE STORAGE

## SYSTÈME UNIVERSEL DE DOSSIERS ET BUCKETS
Pour assurer que l'intégralité des médias du site (photos, vidéos, logos, covers) puisse être stockée et servie dynamiquement sans toucher au code, vous devez configurer le service Supabase Storage.

### ÉTAPE 1 : CRÉATION DES BUCKETS
1. Dans le tableau de bord Supabase, cliquez sur l'icône de dossier **"Storage"** dans la barre latérale gauche.
2. Cliquez sur le bouton vert **"New Bucket"**.
3. **Bucket Name :** Saisissez exactement `site-assets`.
4. **Public Bucket :** Cochez impérativement la case **"Public"** (cela permet de générer des URLs directes et rapides pour Next.js sans jeton temporaire).
5. Cliquez sur **"Save"**.

Répétez cette opération pour créer les autres buckets métiers du projet :
- `product-images` (Public, pour les fiches produits)
- `brand-assets` (Public, pour les visuels globaux)
- `content-images` (Public, pour les articles de blog/actus)
- `outfits-collection` (Public, pour le module HPB / Looks de Vioutou)

### ÉTAPE 2 : STRUCTURATION DES DOSSIERS LOGIQUES EN BUCKET
Au sein du bucket principal `site-assets`, le système e-commerce organisera automatiquement les fichiers uploadés dans l'arborescence logique suivante :

```text
site-assets/
├── hero/          # Vidéos MP4 et Bannières d'accueil
├── logo/          # Logos PNG, WEBP pour Navbar et Footer
├── testimonials/  # Vidéos MP4 des avis clients VIP
├── ambience/      # Photos d'ambiance et bannières urbaines
├── tiktok/        # Vidéos MP4 importées de TikTok
├── reels/         # Vidéos MP4 importées d'Instagram Reels
├── sections/      # Photos d'illustration des collections
├── thumbnails/    # Miniatures et covers d'articles
├── backgrounds/   # Arrière-plans globaux du site
└── galleries/     # Photos de shooting et galeries
```

### ÉTAPE 3 : OPTIMISATION DU CHARGEMENT ET MISE EN CACHE
1. Dans les options avancées des buckets, vérifiez que le `cacheControl` est défini sur `3600` (1 heure) ou supérieur pour optimiser les performances Lighthouse de la vitrine.
2. Assurez-vous que les options de re-dimensionnement d'image (Image Transformation) sont activées si vous utilisez le mode Pro de Supabase, sinon le système e-commerce interne appliquera une compression en amont via Canvas.

---
**Vos buckets de stockage sont prêts.** Passez au fichier `03_DATABASE_SETUP.md` pour déployer l'architecture de la table des médias.
