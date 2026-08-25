# Analyse et refactor du projet - modifications adoptées

## 1. Objectif de cette passe

Cette passe visait à nettoyer le code sans casser le comportement UX déjà validé :

- garder le style premium existant,
- conserver la logique de soumission d’article via WhatsApp,
- améliorer la lisibilité du code,
- réduire la complexité dans les composants principaux,
- garder la logique réutilisable et plus facile à maintenir.

---

## 2. Problèmes identifiés avant refactor

### 2.1. Composant Hero trop dense

Le composant Hero contenait plusieurs responsabilités dans un seul fichier :

- chargement des données de settings,
- chargement des médias de hero,
- logique d’upload de photo,
- modal de soumission,
- génération du message WhatsApp,
- rendu visuel.

Cela rendait le composant difficile à lire et à maintenir.

### 2.2. Logique métier embedded dans le rendu

Le formulaire article mélangeait :

- validation du fichier,
- parse du téléphone,
- préparation de message WhatsApp,
- logique de fermeture / reset.

Cette logique est importante et aurait avantage à être éclatée dans un petit bloc fonctionnel ou composant dédié.

### 2.3. Données calculées recalculées trop souvent

Le composant Hero utilisait plusieurs expressions répétées pour découper le titre hero et pour recalculer des éléments déjà connus.

### 2.4. Composant Carousel fonctionnel mais peu modulaire

OutfitCarousel fonctionnait, mais certains blocs de logique étaient complexes et peu lisibles :

- drag events,
- scroll auto,
- pause/resume,
- boutons de modal,
- rendu de carte.

Le code pouvait être amélioré sans changer l’effet visible.

---

## 3. Modifications adoptées

### 3.1. Extraction du modal de soumission article

Le composant Hero a été refactoré pour séparer le rendu du modal dans un composant dédié nommé `ArticleSubmissionModal`.

Cela permet :

- de réduire la taille du composant principal,
- de clarifier les responsabilités,
- de réutiliser facilement la structure plus tard si besoin.

### 3.2. Définition de constantes globales

Les valeurs réutilisables comme :

- `DEFAULT_HERO_VIDEO`
- `EMPTY_ARTICLE_FORM`
- `normalizePhoneDigits`

ont été centralisées pour éviter les duplications et les littéraux dispersés.

### 3.3. Sécurisation du chargement des données hero

Le `useEffect` a été protégé avec un garde `isMounted` pour éviter les états post-unmount.

Cela évite un bug classique avec les appels async qui continuent après retrait du composant.

### 3.4. Réduction du calcul récurrent

Le titre hero est maintenant découpé via `useMemo`, ce qui évite de recalculer le split à chaque rendu.

### 3.5. Normalisation de la logique de fermeture du formulaire

Le reset et la fermeture du modal sont centralisés dans `closeArticleForm()`.

Cela réduit la duplication et évite les oublis de nettoyage.

### 3.6. Refactor de l’OutfitCarousel

Le composant OutfitCarousel a été nettoyé en :

- stabilisant la logique de drag,
- évitant certaines redondances de code,
- renommant des variables plus explicites,
- déclarant une constante pour la largeur des cartes,
- utilisant un bouton dédié pour la carte produit au lieu d’un simple `div` cliquable.

Cela améliore l’accessibilité et la lisibilité.

### 3.7. Composant plus propre et plus accessible

Les cartes d’outfit sont maintenant rendues avec `button` plutôt qu’un `div` cliquable, ce qui est plus sémantique pour l’interface.

---

## 4. Points de performance améliorés

### 4.1. Mémoïsation des calculs légers

Le calcul du titre et la duplication des outfits sont désormais mieux structurés.

### 4.2. Moins de logique dans le rendu

Le composant principal est plus lisible et plus facile à optimiser ensuite.

### 4.3. Mieux séparation des responsabilités

Cela facilite le remplacement futur de la logique WhatsApp ou du modal sans toucher au reste du composant.

---

## 5. Recommandations pour la suite

### 5.1. Extraire la logique via un hook dédié

Idéalement, la logique de soumission d’article devrait être migrée dans un hook comme :

- `useArticleSubmission`

Cela rendrait le composant Hero encore plus léger.

### 5.2. Isoler le modal dans un composant fichier dédié

Si le besoin grandit, le composant `ArticleSubmissionModal` peut être déplacé dans un fichier distinct dans `src/components/public/home/`.

### 5.3. Centraliser le message WhatsApp

Le format du message WhatsApp est métier. Il pourrait être factorisé dans un service dédié, par exemple :

- `src/services/articleSubmissionService.ts`

Cela permet de :

- tester facilement,
- changer le format sans toucher le composant UI,
- réutiliser la logique ailleurs.

### 5.4. Utiliser des composants plus petits pour les sections hero

Le composant Hero pourrait être scindé ensuite en :

- `HeroBackground`
- `HeroActions`
- `HeroTitle`
- `ArticleSubmissionModal`

---

## 6. État actuel

Le projet est dans un meilleur état de lisibilité et de maintenabilité, sans casser la logique fonctionnelle existante.

La prochaine étape idéale serait :

- nettoyage plus avancé de la logique métier,
- extraction des services,
- ajout de tests ciblés sur la génération du message WhatsApp et la validation du formulaire.

---

## 7. Fichiers modifiés lors de cette passe

- `src/components/public/home/Hero.tsx`
- `src/components/public/home/OutfitCarousel.tsx`

---

## 8. Conclusion

La base a été rendue plus propre, plus explicite et plus réutilisable. Les performances sont meilleures au niveau de la structure logique, et le code est maintenant plus facile à faire évoluer sans risque de régression visuelle.
