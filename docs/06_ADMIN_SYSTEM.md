# 06. ADMIN SYSTEM — LE TABLEAU DE BORD DE VIOUTOU

## PHILOSOPHIE ARCHITECTURALE DU DASHBOARD PERSCADORS
L'interface d'administration de la plateforme Perscadors (accessible sous `/admin`) a été pensée pour répondre aux besoins et habitudes de l'influenceur Vioutou (HP Collection).

### 1. LA VITESSE WHATSAPP ET L'EFFET IKEA
Vioutou gère historiquement tout son business via WhatsApp. L'objectif absolu de notre back-office n'est pas seulement de remplacer WhatsApp, mais d'être **plus rapide, plus pratique, plus ordonné et plus professionnel que WhatsApp**.
- **Effet IKEA :** L'administrateur personnalise lui-même ses bannières, ses zones de livraison, ses templates de messages et l'ensemble de ses médias.
- **Zéro barrière technique :** Vioutou ne connaît pas Supabase, SQL, ni les concepts de migration. Il ne doit **jamais** voir un message d'erreur technique brut ni un bouton demandant d'exécuter du code.

### 2. ARCHITECTURE DES ROUTES ADMIN (App Router Next.js 16.2)
Le tableau de bord repose sur un réseau de routes protégées par Supabase Auth :
- **`/admin` :** Tableau de bord principal (Chiffres clés, Top 3 best-sellers, actions rapides).
- **`/admin/produits` :** Catalogue complet avec *Levier 1* (Quick Inline Editing : modification instantanée du prix, des stocks et de la visibilité).
- **`/admin/commandes` :** Pilotage logistique avec *Levier 2* (Logistique Éclair : envoi direct sur WhatsApp des détails et encaissements pour le livreur).
- **`/admin/clients` :** Segmentation automatique et bouton magique VIP (seuil de 50 000 FCFA).
- **`/admin/hpb` :** Module HPB (Gestion des Looks de Vioutou avec Product Picker visuel).
- **`/admin/media` :** **Universal Media Dashboard** (Gestion dynamique et flexible de tous les médias du site).
- **`/admin/reglages` :** Personnalisation des templates WhatsApp, FAQ, et configuration de base.
- **`/admin/stock` :** Alertes de ruptures de stock.

### 3. NAVIGATION MOBILE OPTIMISÉE (Bottom Bar Navigation)
Puisque Vioutou gère 90% de son activité depuis son iPhone, le tableau de bord n'utilise pas une sidebar classique sur mobile, mais une **Bottom Bar Navigation en verre dépoli** (Levier 3) :
- Accès instantané aux 4 piliers majeurs à un seul pouce.
- Bouton "Plus" escamotable ouvrant les onglets complémentaires (Gestion Médias, Analytics, Alertes Stock).
- Transitions haptiques et retours visuels élégants.

### 4. GESTION DU REPLI ET DES ERREURS SILENCIEUSES
Chaque interaction admin est couplée à un système de double persistance (`Supabase` + `localStorage`). Si Supabase est indisponible ou renvoie une erreur RLS, le changement s'opère instantanément dans la mémoire locale, garantissant un fonctionnement fluide et sans coupure.

---
**L'écosystème admin est maîtrisé.** Passez au fichier `07_MEDIA_UPLOAD_SYSTEM.md` pour l'anatomie de la gestion des médias.
