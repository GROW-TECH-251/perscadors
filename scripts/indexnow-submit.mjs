#!/usr/bin/env node
// scripts/indexnow-submit.mjs
// ============================================
// MISSION SEO (07/11) — soumission IndexNow des URLs du site.
//
// IndexNow : protocole gratuit (indexnow.org) permettant de prévenir
// PARTICIPANT les moteurs (Bing, Yandex, Seznam, Naver…) qu'une URL a changé
// ou doit être (re)explorée. Google ne le prend PAS en charge — pour Google,
// rester sur le sitemap + la Search Console. Bénéfice réel : découverte plus
// rapide des pages par Bing (important au Bénin où Bing alimente aussi la
// recherche Windows/Ecosystem).
//
// La clé doit être SERVIE PUBLIQUEMENT sur /<clé>.txt (c'est le mécanisme de
// preuve de propriété d'IndexNow — ce n'est PAS un secret).
//
// Usage :
//   node scripts/indexnow-submit.mjs                     # soumet tout le sitemap
//   node scripts/indexnow-submit.mjs https://…/page1 …   # soumet des URLs précises
//
// À lancer après chaque déploiement (npm run seo:indexnow).

import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HOST = 'https://perscadors.vercel.app';
const API = 'https://api.indexnow.org/indexnow';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = join(here, '..', 'public');

// La clé = l'unique fichier .txt à la racine de public/ (déposé par la mission SEO).
const keyFile = readdirSync(publicDir).find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
if (!keyFile) {
  console.error('Clé IndexNow introuvable : déposer un fichier <clé>.txt dans public/.');
  process.exit(1);
}
const KEY = keyFile.replace('.txt', '');
const keyLocation = `${HOST}/${keyFile}`;

// 1. Liste d'URLs : arguments, sinon tout le sitemap en production.
async function collectUrls() {
  if (process.argv.length > 2) return process.argv.slice(2);
  const response = await fetch(`${HOST}/sitemap.xml`);
  if (!response.ok) {
    console.error(`Sitemap injoignable (${response.status}) — déployer d'abord, ou passer des URLs en arguments.`);
    process.exit(1);
  }
  const xml = await response.text();
  return [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
}

// 2. Soumission (jusqu'à 10 000 URLs par requête — le site en compte ~100).
const urlList = await collectUrls();
console.log(`Soumission IndexNow : ${urlList.length} URL(s) — clé ${KEY}`);

const response = await fetch(API, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(HOST).host, key: KEY, keyLocation, urlList })
});

// Codes IndexNow : 200 = OK, 202 = accepté (revalidation de la clé en cours),
// 400/403/422 = requête ou clé invalide, 429 = trop de requêtes.
console.log(`Réponse : HTTP ${response.status} ${response.statusText}`);
if (response.status === 200 || response.status === 202) {
  console.log('OK — les moteurs participants ont été notifiés (Bing, Yandex…).');
} else {
  const body = await response.text().catch(() => '');
  console.error(`Échec — vérifier la clé servie sur ${keyLocation} (doit contenir exactement « ${KEY} »).`, body.slice(0, 300));
  process.exit(1);
}
