# 07. MEDIA UPLOAD SYSTEM — ANATOMIE DE LA GESTION DES MÉDIAS

## FONCTIONNEMENT DU REGROUPEMENT DYNAMIQUE (Universal Media Dashboard)
La page `/admin/media` permet à Vioutou d'uploader, remplacer, supprimer et organiser l'intégralité des visuels de la boutique en ligne sans aucune manipulation de code.

### 1. LE PRINCIPE DE FLEXIBILITÉ TOTALE (Image vs Vidéo)
La règle sacrée du gestionnaire de médias Perscadors est qu'aucune zone média n'est arbitrairement limitée à un format strict :
- **Libre arbitre :** Chaque section (Héros, Bannières d'ambiance, Témoignages) accepte **soit une image** (JPG, PNG, WEBP), **soit une vidéo** (MP4, MOV, WEBM).
- **Rendu intelligent :** Côté vitrine (`Hero.tsx`, `Testimonials.tsx`), les composants inspectent l'attribut `type` du média. S'il s'agit d'une vidéo, Next.js génère une balise `<video autoPlay loop muted>`. S'il s'agit d'une image, c'est le composant `<Image>` de Next.js qui prend le relai.

### 2. ARCHITECTURE HYBRIDE DES EMBEDS SOCIAUX (TikTok / Reels)
Pour refléter l'activité d'influenceur de Vioutou, les sections sociales (`tiktok`, `reels`, `testimonials`) disposent d'un mode de saisie hybride :
- **Mode Upload Fichier :** Vioutou glisse-dépose son fichier MP4 brut capturé avec son téléphone.
- **Mode URL Sociale :** Vioutou colle l'URL directe de sa vidéo TikTok ou de son Reel Instagram. Le système génère une carte d'aperçu premium redirigeant vers le contenu viral.

### 3. CINÉMATIQUE DE LA MODALE D'UPLOAD
1. L'administrateur clique sur **"Uploader un Média"** pour la section active.
2. La modale s'ouvre. Elle intègre une **zone de Dropzone avancée** (glisser-déposer ou clic de parcours).
3. Dès sélection du fichier, un aperçu complet (image ou lecteur vidéo) est immédiatement chargé en mémoire locale (`URL.createObjectURL`).
4. Saisie obligatoire du Titre et du Texte Alternatif (Alt text) pour garantir le respect des normes SEO et d'accessibilité.
5. Au clic sur "Enregistrer", le fichier est téléversé en asynchrone dans le bucket `site-assets` de Supabase Storage.
6. Une ligne est insérée dans la table `site_assets`.
7. Le cache `localStorage` est actualisé et un Toast en verre dépoli notifie le succès de l'opération.

### 4. VITESSE D'ADOPTION ET RETOURS UTILISATEURS (UX Non-Technique)
Pour éviter la panique technique :
- **Actions directes :** Un simple clic sur l'icône d'œil (`Eye`) bascule le média d'actif à inactif sur le site en ligne.
- **Sécurité de suppression :** Une confirmation claire avertit Vioutou avant la purge définitive d'un fichier du bucket Storage.
- **Toast explicite :** Des notifications textuelles claires (ex: *"Média uploadé et synchronisé en direct sur le site !"*) remplacent les journaux de console bruyants.

---
**Le système de gestion des médias est en place.** Passez au fichier `08_STORAGE_POLICIES.md` pour verrouiller les permissions de sécurité.
