# Étude — Partage WhatsApp natif GRATUIT (photo / texte / média)

**E6 — axe Landron (WhatsApp / photo / texte) · 07/09/2026 · zéro dépendance, zéro coût**

---

## 1. Contexte et question

Peut-on envoyer une **photo réelle** (pièce jointe) et un **texte** vers WhatsApp depuis le site, **sans service payant, sans SDK, sans dépendance ajoutée** ?

**Réponse courte : oui, c'est déjà en place et correctement architecturé.** Cette étude l'inventorie, l'explique, documente ses limites plateforme, et E6 y apporte deux mini-corrections de robustesse. Aucune nouvelle fonctionnalité, aucune lib.

## 2. Inventaire du code existant (audité)

### 2.1 Les deux briques — `src/services/whatsappShareService.ts`

| Fonction | Rôle | Gardes |
|---|---|---|
| `shareFileWithText(file, text)` | Partage d'un **fichier local** (choisi par l'utilisateur) + texte via la **feuille système** `navigator.share` | `navigator.share` **et** `navigator.canShare({ files })` requis ; `AbortError` distingué (annulation ≠ échec) ; replis : `unsupported` / `failed` / `aborted` |
| `shareMediaToWhatsAppStatus(url, title)` | Partage d'un **média du site** (image produit/look/post) vers Statut WhatsApp : fetch → `File` → feuille système | Mêmes gardes canShare ; repli : ouverture du média dans un onglet + message explicite |

### 2.2 Les points d'appel (5)

| Page | Parcours |
|---|---|
| Home « Ajouter une photo » (modale article) | **Mobile** : photo = média réel dans la feuille système + message ; **repli desktop** : upload → URL publique dans un message wa.me |
| Admin Produits | « Partager » une fiche → image vers Statut WhatsApp |
| Admin Contenu | Partage d'un post (image) |
| Admin HP Looks | Partage d'un outfit (image) |

### 2.3 Pourquoi `wa.me` ne suffit pas

`wa.me` (Click-to-Chat) **ne transmet que du texte** — impossible d'y joindre un fichier. Le seul moyen navigateur d'attacher une photo est la **Web Share API (niveau 2)** avec `files: [File]`, qui ouvre la feuille de partage du système où l'utilisateur choisit WhatsApp. C'est exactement ce que fait le site.

## 3. Matrice de support (Web Share API **avec fichiers**)

| Navigateur | Partage fichiers | Comportement observé sur le site |
|---|---|---|
| iOS Safari ≥ 15 | ✅ | feuille système, photo jointe |
| Chrome Android | ✅ | feuille système, photo jointe |
| Samsung Internet | ✅ | idem |
| Chrome/Edge **desktop** (Windows/macOS récents) | ✅ (partiel selon version/OS) | feuille native du système |
| Firefox desktop | ❌ | repli automatique : upload + URL dans wa.me |
| Navigateurs anciens | ❌ | idem |

⚠️ La matrice exacte évolue avec les versions : le site ne **suppose** rien — il teste `navigator.canShare({ files })` **à l'exécution** et se dégrade proprement. C'est la seule approche fiable.

## 4. Limitations plateforme documentées (aucune n'est un bug du site)

1. **wa.me = texte seul** → le repli desktop passe par une URL publique de l'image (upload Supabase/Cloudinary déjà en place).
2. **Caption Android** : WhatsApp Android ignore parfois le **texte** quand un fichier est joint (comportement plateforme). Le site **copie déjà le message au presse-papier en secours** (finalisation 09/2026) — l'utilisateur le colle si la caption n'a pas suivi.
3. **Activation utilisateur (iOS Safari)** : `navigator.share` doit survenir dans la foulée d'un geste ; après un `await fetch` long, Safari peut refuser (`NotAllowedError`). Le site retombe alors sur l'ouverture du média dans un onglet. *(Piste d'amélioration : pré-chargement du blob avant le clic — voir BACKLOG.)*
4. **Taille des médias** : aucun partage de très grosse vidéo aujourd'hui (les partages sont des images) ; sinon l'échec est capté → repli onglet.
5. **CORS** : les médias Cloudinary sont servis avec `Access-Control-Allow-Origin: *` → le `fetch` navigateur fonctionne ; les `/assets` locaux sont same-origin.

## 5. Décision d'architecture (conclusion de l'étude)

L'approche actuelle — **Web Share API + gardes strictes + replis progressifs (média réel → URL + wa.me → onglet)** — est la bonne solution **gratuite et zéro dépendance**. Aucune alternative gratuite ne fait mieux : les SDK WhatsApp Business (API Cloud/Meta) sont payants et hors périmètre ; les deep-links `whatsapp://attach` ne sont pas standards et ne fonctionnent pas sur le web. **On conserve l'architecture telle quelle.**

## 6. Mini-corrections apportées en E6 (robustesse, pas de fonctionnalité)

Dans `shareMediaToWhatsAppStatus` :
1. **Timeout du fetch (12 s)** — un média lent/injoignable ne laisse plus le bouton admin sans retour indéfiniment : repli onglet au bout de 12 s.
2. **Extension du fichier correcte** — nouveau helper pur `mediaShareExtension(blobType, url)` : carte MIME→extension (`webp`, `heic`, `mov`, `webm`…), repli sur l'extension de l'URL, puis `jpg`. Avant : tout non-png était nommé `.jpg` (contenu webp nommé .jpg → rejet possible par les lecteurs stricts).

Couvertures : `tests/unit/whatsappShare.test.ts` (comportement du helper + gardes structurelles).

## 7. BACKLOG / FUTURE IMPROVEMENTS (hors périmètre E6)

- Pré-charger le blob du média au survol du bouton de partage (annule la limitation §4.3 sur Safari).
- Étendre le partage Statut aux **vidéos** produit (extension vidéo déjà prévue par le helper).
- `share target` (PWA) pour recevoir des partages ENTRANTS — pertinent seulement si le site devient une PWA installée.
