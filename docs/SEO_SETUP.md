# SOCIAL SHARING — OPEN GRAPH ET PARTAGE VIRAL WHATSAPP

## STRATÉGIE DE PARTAGE PREMIUM (WhatsApp, Facebook, LinkedIn, Telegram)
Puisque Vioutou mène son activité d'influenceur sur les réseaux sociaux et sur WhatsApp, chaque lien partagé doit arborer une carte visuelle somptueuse qui donne envie de cliquer et inspire un professionnalisme d'élite.

### 1. FONCTIONNEMENT DES BALISES OPEN GRAPH (OG & Twitter)
Lorsqu'un lien `https://perscadors.vercel.app/` est collé dans un message WhatsApp ou sur un post Facebook, les serveurs de la plateforme parcourent la balise `<head>` à la recherche des métadonnées `og:`.

Notre refonte a permis le déploiement des balises suivantes :
- **`og:title` :** Personnalisé par page (ex: `Basket Urban Luxe Gold | HP Collection Cotonou`).
- **`og:description` :** Extrait propre de la fiche technique ou slogan immersif.
- **`og:image` :** Raccordement direct à la première image du vêtement ou au visuel du look.
- **`og:type` :** Évalué à `website` sur l'accueil et `product` sur les fiches d'articles.

### 2. SPÉCIFICATIONS TECHNIQUES DU CACHE WHATSAPP (Important)
WhatsApp utilise un cache d'aperçu d'URL (Link Preview Buffer) soumis à des contraintes de poids et de dimensions strictes :
- **Résolution Idéale :** 1200 x 630 pixels.
- **Taille de fichier maximale :** L'image OG doit peser moins de 300 Ko pour que WhatsApp génère l'aperçu instantanément sur les connexions mobiles 3G/4G au Bénin.
- **Le Suffixe `metadataBase` :** Indispensable. Sans la déclaration `new URL('https://perscadors.vercel.app')` dans `layout.tsx`, Next.js ne transmettrait qu'une URL relative (`/images/...`) que le bot WhatsApp serait incapable d'ouvrir.

### 3. CONSEILS POUR LES POSTS D'ACQUISITION CLIENT (Vioutou)
Lorsque Vioutou lance un nouveau "Drop", voici la structure de post social idéale pour accompagner l'Open Graph :

```text
🔥 NOUVEAU DROP DISPONIBLE — HP COLLECTION 🔥
La nouvelle collection streetwear été 2026 est officiellement en ligne !
👑 Baskets Premium, Complets Monogrammés et Jeans Oversize.
💬 Commande instantanée via WhatsApp + Livraison Express dans tout le Bénin 🇧🇯.

👉 Clique sur la carte ci-dessous pour découvrir mes HP Looks exclusifs :
https://perscadors.vercel.app/looks
```

---
**Vos cartes de partage sont splendides.** Passez au document `PERFORMANCE.md` pour valider les signaux web essentiels.
