# 09 — Matrice de récupération `feature/orders-whatsapp`

## Contexte

Ce document prépare l'intégration contrôlée des points positifs de la branche `feature/orders-whatsapp` dans la branche stable `feature/ui-ux`.

### Principe directeur

Nous **ne mergeons pas** la branche `feature/orders-whatsapp` telle quelle.

Nous allons :

1. identifier ce qui est réellement utile côté produit / UX ;
2. identifier ce qui est techniquement fragile ou redondant ;
3. décider ce qui doit être :
   - repris tel quel conceptuellement,
   - réimplémenté proprement,
   - ignoré ;
4. préparer les tickets suivants du Pôle 5.

## État des branches auditées

### Branche stable de référence
- `feature/ui-ux`
- état : stable
- build : OK
- lint : OK

### Branche source d'idées checkout
- `feature/orders-whatsapp`
- état : instable
- build : KO
- lint : KO

## Fichiers spécifiques observés dans `feature/orders-whatsapp`

### Nouveaux fichiers introduits
- `src/app/order/[token]/page.tsx`
- `src/components/checkout/CheckoutDrawer.tsx`
- `src/components/checkout/OrderSuccess.tsx`
- `src/components/checkout/StepConfirm.tsx`
- `src/components/checkout/StepForm.tsx`
- `src/components/checkout/StepRecap.tsx`
- `src/services/whatsappService.ts`

### Fichiers modifiés
- `src/components/cart/CartDrawer.tsx`
- `src/services/orderService.ts`
- `src/types/index.ts`
- `package.json`
- `package-lock.json`
- `.env.local` (renommage depuis `.env.example` dans cette branche)

## Diagnostic global

### Forces de la branche `feature/orders-whatsapp`
- excellente intention produit sur le tunnel de commande ;
- checkout en 3 étapes plus rassurant ;
- meilleur sentiment de progression utilisateur ;
- présence d'un écran de succès ;
- présence d'une page publique de suivi de commande ;
- séparation de la logique WhatsApp dans un service dédié.

### Faiblesses de la branche `feature/orders-whatsapp`
- base héritée de `develop`, donc build déjà fragile ;
- types doublonnés / divergents ;
- modèle commande incohérent avec la branche stable ;
- présence de champs non alignés avec `feature/ui-ux` (`public_token`, `grand_total`, `customer.address`, `customer.city`) ;
- risque élevé de duplication métier si merge brut.

## Décision d'intégration

### Décision globale
**Récupération sélective par réimplémentation**, pas de merge brut.

## Matrice de récupération

| Élément source (`feature/orders-whatsapp`) | Valeur UX / produit | Qualité technique actuelle | Décision | Cible dans `feature/ui-ux` | Commentaire |
|---|---|---|---|---|---|
| `CheckoutDrawer.tsx` | Forte | Moyenne | Réimplémenter proprement | `src/components/checkout/CheckoutDrawer.tsx` | Très bon modèle de tunnel, mais pas à reprendre tel quel |
| `StepRecap.tsx` | Forte | Bonne | Réimplémenter proprement | `src/components/checkout/StepRecap.tsx` | Bon découpage, à réaligner avec le panier actuel |
| `StepForm.tsx` | Forte | Bonne | Réimplémenter proprement | `src/components/checkout/StepForm.tsx` | Bonne base UX, validations à renforcer selon le flux stable |
| `StepConfirm.tsx` | Très forte | Moyenne | Réimplémenter proprement | `src/components/checkout/StepConfirm.tsx` | Bonne logique d’intention, mais dépend de types divergents |
| `OrderSuccess.tsx` | Très forte | Bonne | Réimplémenter proprement | `src/components/checkout/OrderSuccess.tsx` | Excellente idée de réassurance post-commande |
| `src/app/order/[token]/page.tsx` | Très forte | Moyenne | Réimplémenter + sécuriser | `src/app/order/[token]/page.tsx` | À refondre avec un vrai modèle de suivi public sécurisé |
| `whatsappService.ts` | Moyenne à forte | Bonne | Réimplémenter partiellement | `src/services/whatsappService.ts` | Bonne séparation conceptuelle, à aligner avec `orderService` stable |
| modification de `CartDrawer.tsx` | Forte | Faible | Ne pas reprendre tel quel | `src/components/cart/CartDrawer.tsx` | Le drawer actuel doit devenir une porte d’entrée vers le nouveau checkout |
| extension des types dans `src/types/index.ts` | Moyenne | Faible | Reprendre seulement les idées | `src/types/index.ts` + `src/admin/types.ts` | Éviter les doublons et types legacy |
| route de succès / suivi public | Très forte | Moyenne | Reprendre conceptuellement | `src/app/order/[token]/page.tsx` + `src/components/checkout/OrderSuccess.tsx` | Fort levier de confiance |

## Éléments à ne pas intégrer tels quels

### À rejeter en l'état
- l'ancien modèle `Order` avec `customer.address` / `customer.city` ;
- les champs `grand_total` utilisés comme vérité principale ;
- la dépendance directe à `public_token` sans migration contrôlée ;
- le code hérité qui laisse le build / lint cassés ;
- toute duplication entre le drawer actuel de `feature/ui-ux` et le checkout de cette branche.

## Cible d'architecture recommandée

### Source de vérité
La branche **source de vérité** reste :
- `feature/ui-ux`

### Rôle de `feature/orders-whatsapp`
La branche devient une :
- **source d’inspiration fonctionnelle / UX**
- et non une branche à merger directement.

## Tickets dépendants préparés

### Ticket 2 — Checkout premium multi-étapes
Ce ticket récupère :
- la progression visuelle ;
- le découpage des étapes ;
- la structure de confirmation.

### Ticket 3 — Écran de succès premium
Ce ticket récupère :
- le pattern de fin de tunnel ;
- la réassurance utilisateur.

### Ticket 4 — Suivi public de commande
Ce ticket récupère :
- l’idée de la route `/order/[token]` ;
- la notion de suivi client.

## Préconisations techniques avant implémentation

1. conserver `src/services/orderService.ts` de `feature/ui-ux` comme base stable ;
2. créer un nouveau `src/services/whatsappService.ts` si besoin, mais sans dupliquer `orderService` ;
3. créer un vrai composant `CheckoutDrawer` dans `feature/ui-ux` ;
4. faire du `CartDrawer` actuel un point d'entrée vers le tunnel ;
5. prévoir une migration future pour un vrai `public_token` sur `orders` ;
6. ne pas importer les types de `feature/orders-whatsapp` sans nettoyage.

## Résultat attendu après récupération

Après intégration propre des points positifs, `feature/ui-ux` devra obtenir :

- un tunnel de commande premium en plusieurs étapes ;
- une confirmation de commande plus crédible ;
- un succès de commande premium ;
- un futur suivi public de commande ;
- une meilleure perception de maîtrise et de confiance côté client.

## Statut de ce ticket

### Ticket 1
- type : audit / préparation d’implémentation
- impact code : faible
- impact décisionnel : critique
- dépendance : aucune
- débloque : Tickets 2, 3 et 4

## Validation attendue

### Ce ticket est considéré terminé si :
- la matrice de récupération est validée ;
- la décision "pas de merge brut" est entérinée ;
- la liste des fichiers cibles pour la réimplémentation est arrêtée ;
- l’équipe comprend clairement ce qu’on garde et ce qu’on rejette.