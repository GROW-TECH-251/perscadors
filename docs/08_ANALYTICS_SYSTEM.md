# 08b - Système d'Analytics Réel

## 1. Méthodologie
Nous utilisons un système de tracking d'événements personnalisé stocké dans Supabase. Cela permet de mesurer le tunnel de conversion sans dépendre de cookies tiers (RGPD friendly).

**Tunnel suivi :**
Visite Produit → Ajout Panier → Clic WhatsApp → Commande Livrée.

## 2. Collecte des données
Chaque action clé déclenche un appel au `analyticsService`. Les données collectées incluent :
- Le nom de l'événement.
- Les métadonnées (ID produit, catégorie, prix).

## 3. Agrégation (Edge Computing)
Le dashboard admin appelle des fonctions SQL (RPC) qui calculent :
- Le Chiffre d'Affaires réel (uniquement les commandes `LIVRÉE`).
- Le taux de conversion WhatsApp.
- Le top 5 des produits les plus consultés.

## 4. Visualisation
L'interface utilise **Recharts** pour transformer ces données brutes en graphiques temporels (Ventes par jour).