# Guide de style - couleurs et visuels

But: centraliser où modifier les couleurs, polices et styles globaux.

## Variables globales CSS

Fichier principal à modifier : `src/app/globals.css`

Les variables importantes se trouvent en haut :

- `--color-brand-bg` : couleur de fond générale
- `--color-brand-bg-alt` : fond alternatif
- `--color-brand-gold` : couleur principale (gold)
- `--color-brand-gold-light` : variation gold
- `--color-brand-text` : couleur texte principale
- `--color-brand-text-muted` : texte secondaire
- `--background` et `--foreground` : couleurs utilisées par `body`

Pour modifier la palette globale, édite ces variables en haut de `globals.css`.

Exemple :

- Remplace `--color-brand-gold` par la couleur souhaitée.

## Polices

Les variables `--font-bebas` et `--font-barlow` sont définies dans `globals.css`.
Si tu veux changer la police :

1. Ajoute l'import ou le lien de la police dans `app/layout.tsx` (ou `_document.tsx` si existant).
2. Mets à jour la variable `--font-bebas` / `--font-barlow`.

## Tailwind

Le projet semble utiliser Tailwind via `@import "tailwindcss"` dans `globals.css`. Il n'y a pas de `tailwind.config.js` dans la racine — probablement la configuration est minimale ou héritée.

Si tu veux étendre Tailwind :

1. Crée `tailwind.config.js` à la racine :

```js
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}", "./app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-gold": "var(--color-brand-gold)",
        "brand-bg": "var(--color-brand-bg)",
      },
    },
  },
  plugins: [],
};
```

2. Redémarre le serveur de dev après modification.

## Composants spécifiques

- `Hero` : `src/components/public/home/Hero.tsx` — modifie les classes Tailwind ou ajoute des classes utilitaires.
- `OutfitCarousel` : `src/components/public/home/OutfitCarousel.tsx` — la largeur et l'animation sont contrôlées aussi via `globals.css` (.outfit-carousel-track).

## Processus recommandé pour changement visuel

1. Modifie la variable dans `src/app/globals.css`.
2. Lance `npx next dev` pour voir les changements.
3. Si tu veux utiliser Tailwind tokens (ex: `text-brand-gold`), crée `tailwind.config.js` et mappe les couleurs aux variables CSS.

## Exemple rapide — remplacer la couleur gold

1. Ouvre `src/app/globals.css`
2. Change : `--color-brand-gold: #B8952A;` en `--color-brand-gold: #FF6A00;`
3. Sauvegarde et recharge la page.

## Notes

- Les images et vidéos sont dans `public/assets`.
- Pour modifier le style d'un composant, privilégie d'abord la modification des variables globales avant de toucher directement au JSX.

Fin du guide.
Guide de style — Couleurs & visuels

But: modifie ces valeurs pour personnaliser l'apparence globale du site.

1. Variables CSS globales (point d'entrée)

- Fichier : src/app/globals.css
- Section à modifier : le bloc `@theme` et `:root` en haut du fichier.

Exemples de variables importantes :

- --color-brand-bg : couleur de fond principale
- --color-brand-bg-alt : alternative pour cartes/sections
- --color-brand-gold : couleur principale accent (boutons, badges)
- --color-brand-gold-light : accent clair
- --color-brand-text : couleur du texte principal
- --color-brand-text-muted : texte secondaire

Modifier une couleur : remplace la valeur hex dans `src/app/globals.css`.

2. Priorité d'application

- Les composants utilisent principalement des classes Tailwind combinées à des variables CSS.
- Pour un changement rapide, modifie la variable CSS; tous les composants qui l'utilisent héritent immédiatement.

3. Étendre Tailwind (optionnel mais recommandé)

- Si tu veux utiliser `bg-brand-gold` directement dans Tailwind, crée `tailwind.config.js` à la racine :

module.exports = {
content: [
'./src/**/*.{js,ts,jsx,tsx,mdx}',
'./app/**/*.{js,ts,jsx,tsx,mdx}',
],
theme: {
extend: {
colors: {
'brand-gold': 'var(--color-brand-gold)',
'brand-gold-light': 'var(--color-brand-gold-light)',
'brand-bg': 'var(--color-brand-bg)',
'brand-bg-alt': 'var(--color-brand-bg-alt)',
'brand-text': 'var(--color-brand-text)',
'brand-text-muted': 'var(--color-brand-text-muted)',
}
}
},
plugins: [],
};

- Après création, redémarre le serveur de développement.

4. Où changer la typographie

- Variables de font dans `@theme` : `--font-bebas` et `--font-barlow`.
- Si tu remplaces des polices, fais-le via `next/font` ou via import global et mets à jour les variables.

5. Exemples rapides

- Changer la couleur or : dans `src/app/globals.css`, remplace `--color-brand-gold: #B8952A;` par ta valeur.
- Rendre le texte principal plus clair : modifie `--color-brand-text`.

6. Tester localement

- Redémarre le dev :

npm run dev

# ou

npx next dev --hostname 0.0.0.0 --port 3000

7. Astuces

- Pour tests rapides, utilise l'inspecteur du navigateur et modifie les variables CSS dans l'onglet Styles.
- Pour modifications en masse, crée une branche Git et commits tes changements.

8. Veux-tu que je :

- Crée `tailwind.config.js` avec la palette actuelle ? (je peux le faire)
- Applique une nouvelle palette exemple (fournis 3-5 couleurs) ?

Fin.
