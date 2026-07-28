# Perscadors — Guide complet d’audit fonctionnel

> **Public visé :** collaborateurs non techniques, testeurs métier et administrateurs de la boutique.  
> **But :** vérifier méthodiquement le fonctionnement réel de la vitrine, du checkout, de WhatsApp, de l’administration et des protections de base avant toute livraison.

## 1. Présentation du produit

Perscadors est une boutique de mode avec deux espaces complémentaires :

- **Vitrine publique :** découverte des produits, looks, catégories, panier, commande et discussion WhatsApp.
- **Administration :** pilotage des produits, commandes, clients, stock, HP Looks, médias et réglages de la boutique.

Le navigateur WhatsApp reste le canal naturel de conversation. Perscadors sert de centre de contrôle : catalogue, organisation des commandes, contenus et décisions quotidiennes.

## 2. Préparer une campagne de test

### Comptes et prérequis

- Un navigateur desktop récent et un téléphone réel ou un émulateur mobile.
- Un compte Supabase `admin` ou `superadmin`.
- Un compte Supabase authentifié **sans** rôle admin, pour les tests de refus d’accès.
- Un numéro WhatsApp de test.
- Au moins deux produits visibles, avec tailles et couleurs.
- Au moins un produit masqué, si possible.
- Une image produit, une image de look et une vidéo Hero de test.

### Règles de compte-rendu

Pour chaque anomalie, noter :

```text
Date / environnement / appareil / navigateur
URL exacte
Compte utilisé : visiteur, non-admin, admin ou superadmin
Étapes reproduisant le problème
Résultat obtenu
Résultat attendu
Capture d’écran ou vidéo
Impact : bloquant, important, mineur
```

---

# 3. Checklist visiteur — vitrine publique

## 3.1 Accueil, Hero et navigation

### Fonction
Accueil, vidéo Hero, logo, navigation et bouton WhatsApp flottant.

### Objectif
Vérifier qu’un visiteur comprend la boutique et peut naviguer sans erreur.

### Étapes
1. Ouvrir `/`.
2. Vérifier le logo, le titre, le sous-titre et les boutons Hero.
3. Vérifier que la vidéo Hero est complète, non recadrée de manière anormale et lisible.
4. Cliquer sur les liens de navigation et revenir à l’accueil.
5. Cliquer sur le bouton WhatsApp flottant.
6. Modifier un réglage public depuis l’admin dans un autre onglet, puis observer l’actualisation de la vitrine.

### Résultat attendu
- Aucun écran noir non voulu ni ancien visuel réapparu.
- Logo et textes configurés visibles.
- Les vidéos utilisent un ratio complet avec fond noir si nécessaire.
- Les liens ouvrent les pages attendues.
- WhatsApp reçoit un message prérempli.
- Les modifications publiques sont prises en compte sans rechargement complet inutile.

### Cas limites / régression possible
- Vidéo Cloudinary temporairement indisponible.
- Logo vide : fallback attendu.
- Réseau lent.
- Ancien cache navigateur.

### Priorité
**Bloquante**.

## 3.2 Catégories, recherche et filtres

### Fonction
Navigation catégories, recherche, filtres taille et couleur.

### Objectif
Trouver un produit malgré les accents, majuscules ou espaces.

### Étapes
1. Ouvrir une catégorie.
2. Rechercher un produit avec/minuscules, majuscules et accents différents.
3. Cocher une taille, puis plusieurs tailles.
4. Cocher une couleur, puis plusieurs couleurs.
5. Combiner taille et couleur.
6. Réinitialiser les filtres.

### Résultat attendu
- Recherche insensible aux accents, à la casse et aux espaces inutiles.
- Plusieurs tailles : logique OU.
- Plusieurs couleurs : logique OU.
- Taille + couleur : logique ET.
- Aucun produit masqué ne doit apparaître.

### Cas limites / régression possible
- Produit sans taille ou sans couleur.
- Produit visible mais rupture d’une taille.
- Catégorie vide.

### Priorité
**Élevée**.

## 3.3 Fiche produit et panier

### Fonction
Consultation d’un produit, sélection variantes, ajout au panier, modification et suppression.

### Étapes
1. Ouvrir un produit.
2. Parcourir les images.
3. Sélectionner taille et couleur.
4. Ajouter au panier.
5. Ouvrir le panier.
6. Modifier la quantité.
7. Supprimer un article.
8. Ajouter plusieurs produits différents.

### Résultat attendu
- Taille/couleur obligatoires si le produit en possède.
- Quantités et total cohérents.
- Article supprimé immédiatement.
- Panier conservé pendant la navigation courante.

### Cas limites / régression possible
- Double clic sur ajout panier.
- Taille en rupture.
- Produit sans image secondaire.
- Quantité élevée.

### Priorité
**Bloquante**.

## 3.4 Checkout et WhatsApp

### Fonction
Formulaire client, ville, Turnstile, création commande et WhatsApp.

### Étapes
1. Ajouter un produit au panier.
2. Ouvrir le checkout.
3. Saisir nom et ville.
4. Laisser le téléphone vide, puis refaire avec un téléphone valide.
5. Vérifier les villes proposées et saisir une précision libre.
6. Terminer Turnstile.
7. Confirmer la commande.
8. Vérifier DevTools / Network : `POST /api/checkout`.
9. Vérifier l’ouverture de WhatsApp.
10. Vérifier la commande dans l’admin.

### Résultat attendu
- Téléphone recommandé mais non obligatoire.
- Ville obligatoire.
- Bouton de validation désactivé avant Turnstile.
- `POST /api/checkout` répond `200` avec `persisted: true`.
- Commande créée avec `EN ATTENTE` et `synced`.
- Message WhatsApp cohérent et encodé.

### Cas limites / régression possible
- Token Turnstile expiré.
- Sans Turnstile : aucune commande créée.
- Double clic sur confirmer : pas de doublon.
- Réseau interrompu : message clair, pas de faux succès serveur.
- Insertion directe anonyme Supabase : refusée après fermeture RLS.

### Priorité
**Bloquante**.

## 3.5 Looks, témoignages et contenu public

### Fonction
HP Looks, témoignages, FAQ, contenus publiés et partage social.

### Étapes
1. Ouvrir `/looks`.
2. Ouvrir un look, puis un produit du look.
3. Lire FAQ et témoignages.
4. Vérifier les vidéos témoignages.
5. Partager une URL publique dans WhatsApp ou un inspecteur OpenGraph public.

### Résultat attendu
- Looks visibles uniquement s’ils sont publiés.
- Prix look cohérent avec les produits associés.
- FAQ actualisée.
- Témoignages et vidéos non recadrés anormalement.
- Aperçu social conforme à la bannière de partage.

### Priorité
**Élevée**.

---

# 4. Checklist administrateur

## 4.1 Connexion, rôles et déconnexion

### Fonction
Login Supabase + Turnstile, middleware, rôles et logout.

### Étapes
1. Ouvrir `/admin` en navigation privée.
2. Vérifier redirection vers `/admin/login`.
3. Se connecter avec un admin.
4. Ouvrir `/admin` avec un compte non-admin.
5. Cliquer sur Déconnexion.
6. Recharger `/admin` après logout.

### Résultat attendu
- Formulaire login visible sans boucle de redirection.
- Turnstile requis avant connexion.
- Admin/superadmin accède au dashboard.
- Non-admin refusé et redirigé vers login avec raison d’autorisation.
- Logout efface la session et interdit à nouveau `/admin`.

### Priorité
**Bloquante**.

## 4.2 Navigation admin desktop, tablette et mobile

### Fonction
Sidebar desktop et BottomTabs mobile.

### Étapes
1. Ouvrir `/admin` plein écran desktop.
2. Vérifier sidebar gauche, logo, groupes `Piloter`, `Vendre`, `Configurer` et déconnexion.
3. Réduire progressivement la fenêtre sous le breakpoint desktop.
4. Vérifier BottomTabs et Menu mobile.
5. Vérifier toutes les destinations du menu.

### Résultat attendu
- Desktop : sidebar visible, contenu décalé correctement, BottomTabs cachée.
- Mobile/tablette étroite : sidebar cachée, BottomTabs visible.
- Aucun menu ne disparaît et toutes les routes sont accessibles.

### Cas limites / régression possible
- Zoom navigateur non standard.
- Écran large, écran tactile, tablette paysage.
- Overlay du menu mobile.

### Priorité
**Bloquante**.

## 4.3 Dashboard

### Fonction
Indicateurs, priorités, commandes récentes, best-sellers et raccourcis.

### Étapes
1. Ouvrir `/admin`.
2. Vérifier KPI revenu, commandes, clients et produits.
3. Cliquer chaque carte de priorité.
4. Vérifier commandes récentes et top produits.
5. Tester le partage Story WhatsApp si disponible.

### Résultat attendu
- Données cohérentes avec commandes et produits réels.
- Toutes les cartes pointent vers la bonne page.
- Toasts disparaissent automatiquement et peuvent être fermés.

### Priorité
**Élevée**.

## 4.4 Produits et catégories

### Fonction
Créer, modifier, masquer, supprimer, gérer stock, images et catégories.

### Étapes
1. Créer un produit complet.
2. Uploader une ou plusieurs images.
3. Modifier prix, description, tailles, couleurs, visibilité et stock.
4. Mettre une taille en rupture puis la rétablir.
5. Créer, afficher, masquer et supprimer une catégorie.
6. Masquer le produit puis vérifier la vitrine.
7. Supprimer le produit après confirmation.

### Résultat attendu
- Création synchronisée serveur.
- Produits masqués absents de la vitrine.
- Images uploadées et supprimées correctement.
- Catégories synchronisées.
- Aucun faux succès quand Supabase refuse une écriture.

### Priorité
**Bloquante**.

## 4.5 Stock

### Fonction
Consultation stock, réapprovisionnement rapide et masquage temporaire.

### Étapes
1. Ouvrir `/admin/stock`.
2. Réapprovisionner un produit avec `+5` puis `+10`.
3. Vérifier une rupture.
4. Masquer temporairement un produit épuisé.

### Résultat attendu
- Quantités cohérentes avec les produits.
- Alertes stock pertinentes.
- Les boutons ne créent pas de double incrémentation au double clic.

### Priorité
**Élevée**.

## 4.6 HP Looks

### Fonction
Créer look, associer produits, image, visibilité, recalcul prix et WhatsApp.

### Étapes
1. Ouvrir `/admin/hpb`.
2. Créer un look avec image et produits.
3. Vérifier le prix calculé automatiquement.
4. Ajouter puis retirer une pièce.
5. Modifier visibilité.
6. Partager Statut WhatsApp.
7. Envoyer un look à un client ou numéro externe.

### Résultat attendu
- Prix recalculé depuis les produits, sans prix manuel.
- Une seule action claire de gestion de l’outfit.
- Look masqué absent de la vitrine.
- Partage sans image : message clair, aucune action invalide.

### Priorité
**Bloquante**.

## 4.7 Commandes

### Fonction
Consultation, changement statut, expédition livreur, export et récupération.

### Étapes
1. Créer une commande via checkout.
2. Ouvrir `/admin/commandes`.
3. Modifier son statut : attente, confirmée, livraison, livrée.
4. Envoyer l’ordre de livraison WhatsApp.
5. Exporter CSV.
6. Créer une commande WhatsApp manuellement si cette action est active.
7. Vérifier les commandes en attente d’enregistrement.

### Résultat attendu
- Commande visible sans rechargement manuel excessif.
- Historique mis à jour.
- Modèles WhatsApp utilisés correctement.
- Export cohérent.
- Aucune commande anonyme directe ne peut contourner Turnstile.

### Priorité
**Bloquante**.

## 4.8 Clients

### Fonction
Synthèse client, segments, notes, tags, suppression et campagnes WhatsApp.

### Étapes
1. Ouvrir `/admin/clients`.
2. Rechercher par nom ou téléphone.
3. Ouvrir une fiche client.
4. Ajouter une note et des tags.
5. Vérifier segments VIP, fidèle, gros panier et à relancer.
6. Préparer une relance WhatsApp.
7. Supprimer un client avec confirmation.

### Résultat attendu
- Client créé après une commande synchronisée.
- Notes et tags persistants.
- WhatsApp correctement encodé.
- Suppression contrôlée et non accidentelle.

### Priorité
**Élevée**.

## 4.9 Contenus et annonces

### Fonction
Créer contenu, média, publication, planification, partage WhatsApp et suppression.

### Étapes
1. Ouvrir `/admin/contenu`.
2. Créer une annonce avec image.
3. Enregistrer brouillon, publier puis planifier si disponible.
4. Partager en Statut WhatsApp.
5. Envoyer à un client existant et à un numéro externe.
6. Supprimer image ou contenu avec confirmation.

### Résultat attendu
- Contenu publié visible publiquement.
- Brouillon absent de la vitrine.
- Partage sans média refusé avec message clair.

### Priorité
**Élevée**.

## 4.10 Médias, Cloudinary, Hero, logo et témoignages

### Fonction
Bibliothèque médias, upload, activation, suppression, Cloudinary vidéo et bannière sociale.

### Étapes
1. Ouvrir `/admin/media`.
2. Uploader image produit de test et vidéo MP4 H.264 de test.
3. Activer une vidéo Hero.
4. Vérifier Hero public.
5. Changer logo puis vérifier Navbar et Footer publics.
6. Modifier témoignage et vidéo témoignage.
7. Mettre à jour bannière de partage.
8. Supprimer un média avec confirmation.

### Résultat attendu
- Upload réservé à l’admin.
- Vidéo transcodée Cloudinary et lisible.
- Logo Réglages prioritaire.
- Hero et témoignages non recadrés anormalement.
- Suppression Cloudinary refusée hors admin.

### Priorité
**Bloquante**.

## 4.11 Réglages

### Fonction
Boutique, villes, vitrine, FAQ, WhatsApp, segmentation et sauvegarde.

### Étapes
1. Ouvrir `/admin/reglages`.
2. Modifier nom, devise, pays et délai.
3. Ajouter, modifier puis supprimer une ville de livraison.
4. Vérifier qu’aucun seuil de livraison gratuite n’est affiché.
5. Modifier Hero, Footer, logo, FAQ et témoignages.
6. Modifier les modèles WhatsApp.
7. Enregistrer et vérifier la vitrine dans un second onglet.

### Résultat attendu
- Réglages admin non accessibles au public directement.
- Villes visibles au checkout.
- Changements publics actualisés.
- Les messages checkout, produit, look, annonce, relance et livreur sont utilisés.

### Priorité
**Bloquante**.

## 4.12 Analytics, santé boutique et notifications

### Fonction
Rapports, checklist QA, notifications et exports.

### Étapes
1. Ouvrir `/admin/analytics`.
2. Vérifier chiffres, graphiques et export CSV.
3. Ouvrir `/admin/qa`.
4. Cocher, sauvegarder puis réinitialiser la checklist.
5. Déclencher une action succès, information et erreur.

### Résultat attendu
- Rapports accessibles à l’admin seulement.
- Libellés métier compréhensibles.
- Toast succès : environ 4 s ; information : environ 5 s ; erreur : environ 6 s.
- Bouton de fermeture toujours disponible.

### Priorité
**Moyenne**.

---

# 5. WhatsApp — campagnes, statut et destinataires

## Fonction
Partage média, envoi client existant et contact externe.

## Étapes
1. Depuis produit, look et contenu, utiliser `Statut WhatsApp`.
2. Utiliser `Envoyer client`.
3. Chercher un client existant.
4. Renseigner un nom facultatif et un nouveau numéro WhatsApp.
5. Vérifier le message préparé dans WhatsApp.

## Résultat attendu
- Le navigateur partage le média quand Web Share est disponible.
- Le fallback ne prétend jamais envoyer automatiquement le média.
- Les liens WhatsApp encodent correctement le texte.
- Un contact externe n’est pas créé automatiquement dans Supabase.

## Priorité
**Élevée**.

---

# 6. Tests de robustesse

Pour chaque module important, réaliser au minimum :

| Test | Attendu |
|---|---|
| Double clic bouton créer / enregistrer | Pas de doublon ni double navigation |
| Perte réseau pendant écriture | Message clair, pas de faux succès serveur |
| Rafraîchissement pendant action | État cohérent au retour |
| Annulation modal suppression | Aucune suppression |
| Fichier image très lourd | Refus clair ou comportement contrôlé |
| Vidéo longue / non MP4 | Refus ou message H.264/MP4 clair |
| Plusieurs onglets admin | Mise à jour Realtime cohérente |
| Plusieurs admins | Données cohérentes, pas de conflit silencieux |
| Navigation arrière checkout | Panier et formulaire cohérents |
| Session expirée | Retour login sans boucle |
| Mobile portrait / paysage | Navigation accessible |
| Zoom navigateur 80 %, 100 %, 125 %, 150 % | Sidebar/BottomTabs cohérentes |

---

# 7. Checklist sécurité fonctionnelle

- [ ] Un visiteur ne peut pas ouvrir `/admin`.
- [ ] Un non-admin authentifié ne peut pas ouvrir `/admin`.
- [ ] Un non-admin ne peut pas appeler les API Cloudinary.
- [ ] Turnstile est requis avant login admin.
- [ ] Turnstile est requis avant checkout.
- [ ] `POST /api/checkout` sans token est refusé.
- [ ] Insertion anonyme directe dans `orders` est refusée après fermeture de la policy publique.
- [ ] Les réglages internes ne sont pas lisibles anonymement.
- [ ] La vue publique de réglages fonctionne.
- [ ] Les uploads et suppressions médias sont réservés aux admins.
- [ ] Aucun secret n’est présent dans les captures, commits ou `.env.example`.

---

# 8. Matrice de validation responsive

Tester chaque zone ci-dessous aux largeurs suivantes, sans modifier le zoom navigateur :

| Profil | Largeur CSS conseillée | Contrôle prioritaire |
|---|---:|---|
| Petit Android / iPhone SE | 320–375px | boutons, checkout, formulaires, absence de scroll horizontal |
| iPhone récent / grand Android | 390–430px | Hero, cartes, navigation basse, WhatsApp flottant |
| iPad Mini / tablette | 768px | grilles, modals, tableaux et filtres |
| iPad Pro / laptop étroit | 1024px | bascule sidebar / navigation basse |
| Desktop Full HD | 1280–1536px | sidebar, densité dashboard, tables et cartes |
| Grand écran | 1920px et plus | limites max-width, colonnes, espaces et lisibilité |

## Pages publiques

| Zone | Mobile | Tablette | Desktop / grand écran | Résultat à noter |
|---|---|---|---|---|
| Accueil / Hero | CTA empilés, vidéo non déformée | texte lisible | média complet, pas de bannière historique | Validé / anomalie |
| Navbar / recherche | menu utilisable, recherche accessible | transition propre | liens et panier visibles | Validé / anomalie |
| Catégorie | filtres accessibles, cartes deux colonnes si possible | grille cohérente | filtres et catalogue alignés | Validé / anomalie |
| Produit | images défilables, variantes cliquables | galerie lisible | colonnes équilibrées | Validé / anomalie |
| Looks | cartes lisibles, modal scrollable | deux colonnes si l'espace le permet | grille et modal équilibrées | Validé / anomalie |
| Panier / checkout | drawer entier, boutons atteignables | étapes lisibles | drawer sans débordement | Validé / anomalie |
| Footer / WhatsApp | pas de chevauchement avec navigation | colonnes adaptées | contenu espacé | Validé / anomalie |

## Pages administration

| Zone | Mobile / tablette | Desktop / grand écran | Résultat à noter |
|---|---|---|---|
| Login | formulaire entier, Turnstile visible | carte centrée | Validé / anomalie |
| Navigation admin | BottomTabs et menu mobile | sidebar visible, BottomTabs cachée | Validé / anomalie |
| Dashboard | cartes empilées puis grilles | priorité et KPI lisibles | Validé / anomalie |
| Commandes | filtres défilables, cartes lisibles | grille commandes utilisable | Validé / anomalie |
| Produits / catégories | cartes et actions accessibles | grilles 3–4 colonnes | Validé / anomalie |
| Stock | réassort et cartes accessibles | grille complète | Validé / anomalie |
| Clients | recherche, cartes et modal utilisables | grille clients lisible | Validé / anomalie |
| HP Looks | image, pièces et actions accessibles | cartes équilibrées | Validé / anomalie |
| Contenus | formulaire, média et cartes accessibles | édition confortable | Validé / anomalie |
| Médias | onglets horizontaux utilisables | bibliothèque lisible | Validé / anomalie |
| Réglages | tabs, champs et villes sans coupure | colonnes lisibles | Validé / anomalie |
| Analytics | graphiques défilables ou lisibles | graphiques complets | Validé / anomalie |
| Santé boutique | actions enveloppées, score lisible | header horizontal | Validé / anomalie |

# 9. Checklist finale avant livraison

- [ ] Fonction publique OK
- [ ] Panier OK
- [ ] Checkout OK
- [ ] WhatsApp OK
- [ ] Turnstile login OK
- [ ] Turnstile checkout OK
- [ ] Produits OK
- [ ] Catégories OK
- [ ] Stock OK
- [ ] HP Looks OK
- [ ] Commandes OK
- [ ] Clients OK
- [ ] Contenus OK
- [ ] Médias OK
- [ ] Hero / logo / témoignages OK
- [ ] Réglages OK
- [ ] Dashboard OK
- [ ] Analytics OK
- [ ] Santé boutique OK
- [ ] Notifications OK
- [ ] Realtime OK
- [ ] Desktop OK
- [ ] Tablette OK
- [ ] Mobile OK
- [ ] Rôles admin / non-admin OK
- [ ] RLS / Storage validés
- [ ] `npm run lint` OK
- [ ] `npm run build` OK
- [ ] `npm audit` sans vulnérabilité critique ou élevée
- [ ] Régressions absentes
- [ ] Livraison prête

---

## 9. Incohérences connues à surveiller

- Le rôle SQL `is_admin()` ne reconnaît que `admin`; `is_perscadors_admin()` reconnaît aussi `superadmin`. Vérifier les pages clients et analytics avec un superadmin.
- Les limites de taille/MIME des buckets Storage doivent être configurées et testées dans le dashboard Supabase.
- Une protection Turnstile doit être validée en production pour login et checkout avant livraison.
- Une sidebar desktop doit être testée aux zooms navigateur et breakpoints indiqués ci-dessus.
