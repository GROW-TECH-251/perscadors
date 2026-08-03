# Perscadors — CI/CD de sécurité

## Contrôles automatiques versionnés

Chaque push vers `main` et chaque pull request vers `main` déclenchent :

- `npm ci` : installation strictement verrouillée par `package-lock.json` ;
- `git diff --check` : détection de conflit ou espace invalide ;
- `npm run lint` ;
- `npm run build` ;
- `npm audit --audit-level=high` ;
- Gitleaks : recherche de secrets dans l'historique cloné ;
- CodeQL JavaScript/TypeScript : analyse statique à chaque push/PR et chaque lundi.

Dependabot vérifie chaque semaine les dépendances npm et GitHub Actions.

## Réglages GitHub à activer manuellement

Dans le dépôt GitHub :

1. `Settings → Code security and analysis` : activer Secret scanning et Dependabot alerts.
2. `Settings → Branches → Add branch protection rule` sur `main` : exiger les checks `CI Security Gate` et `CodeQL` avant merge.
3. Ne jamais committer `.env.local`, clés Supabase, Upstash, Cloudflare ou Discord.

## Réponse à une alerte

1. Ne pas exposer la clé dans une issue ou capture.
2. Révoquer/faire tourner la clé chez le fournisseur.
3. Remplacer la variable Vercel/Supabase.
4. Identifier le commit concerné et supprimer le secret de l'historique si nécessaire.
5. Redéployer et documenter l'incident dans le salon Discord de sécurité.
