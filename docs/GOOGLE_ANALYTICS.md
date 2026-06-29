# GOOGLE ANALYTICS — SUIVI DE CONVERSION ET COMPORTEMENT CLIENT

## INTÉGRATION GA4 (Google Analytics 4) ET SUIVI E-COMMERCE
Pour que le tableau de bord d'analyse de Vioutou (`/admin/analytics`) et ses outils de marketing digital puissent suivre l'efficacité du tunnel de vente et de la passerelle WhatsApp, vous devez configurer Google Analytics 4.

### ÉTAPE 1 : CRÉATION DU FLUX DE DONNÉES GA4
1. Connectez-vous sur [analytics.google.com](https://analytics.google.com).
2. Dans la section Administration, créez une nouvelle propriété nommée **HP Collection E-commerce**.
3. Sélectionnez le secteur d'activité **Mode / Vêtements** et le fuseau horaire du Bénin (Afrique/Porto-Novo ou Lagos).
4. Dans **"Flux de données"** (Data Streams), sélectionnez **"Web"**.
5. **URL du site :** `perscadors.vercel.app` (ou votre domaine racine).
6. Cliquez sur **"Créer le flux"**. Copiez l'**ID de Mesure** (Measurement ID) au format `G-XXXXXXXXXX`.

### ÉTAPE 2 : INTÉGRATION DE LA BALISE DANS NEXT.JS
Dans Next.js 16.2 App Router, l'injection de la balise Google Tag Manager / GA4 s'effectue via le composant officiel `@next/third-parties/google` ou par injection directe dans `src/app/layout.tsx` :

```tsx
// Exemple d'implémentation (à ajouter dans le <head> de layout.tsx)
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script
  dangerouslySetInnerHTML={{
    __html: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX', { page_path: window.location.pathname });
    `,
  }}
/>
```

### ÉTAPE 3 : SUIVI SPÉCIFIQUE DE L'OBJECTIF MÉTIER (Conversion WhatsApp)
Le but métier de Perscadors est d'accélérer et suivre la transition vers les expéditions WhatsApp. Dans `src/components/checkout/StepConfirm.tsx`, un événement GA4 personnalisé peut être déclenché au moment de la confirmation :

```javascript
// Déclenchement au sein de handleConfirm()
if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
  window.gtag('event', 'purchase', {
    transaction_id: orderNumber,
    value: cartTotal,
    currency: 'XOF',
    items: orderPreview.map(item => ({ item_name: item.name, price: item.price, quantity: item.quantity }))
  });
}
```

---
**Votre suivi GA4 est paramétré.** Passez au document `GOOGLE_BUSINESS.md` pour l'acquisition de trafic local au Bénin.
