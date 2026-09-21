# Archive éditoriale privée

La liste et le texte des éditoriaux exigent le mot de passe habituel de la Forge (`PALADIN_SECRET`). Les réponses utilisent `private, no-store`, y compris pour les erreurs. Le navigateur ne reçoit que les données demandées après authentification.

Au build, `scripts/prepare-editorials.mjs` récupère `main` de `SaaSpasse/saaspasse-editoriaux` avec une clé SSH de déploiement en lecture seule. Les empreintes d’hôte sont épinglées avec les clés officielles GitHub. Le clone et la clé temporaire sont ensuite supprimés. Aucun historique Git n’est inclus dans l’application.

Le fichier `.netlify/private-editorials.json` n’est ni commité ni placé dans `dist` ou `public`. Netlify l’inclut uniquement dans les fonctions `editoriaux` et `editorial-content`. Une récupération échouée bloque le build et supprime tout ancien snapshot local.

Variables Netlify, contexte production :

- `EDITORIALS_DEPLOY_KEY` : clé privée secrète, limitée à la lecture de ce seul dépôt. Le code l’utilise uniquement au build. Le plan Netlify actuel impose toutefois les scopes builds/functions/runtime; aucune clé ne doit être envoyée au navigateur ou affichée dans les logs.
- `EDITORIALS_KNOWN_HOSTS` : clés SSH publiques de `github.com`, issues de l’API officielle GitHub `/meta`.
- `PALADIN_SECRET` : mot de passe existant, conservé.

Un webhook `push` du dépôt éditorial déclenche le build Netlify de la Forge afin que les nouveaux éditos deviennent disponibles après publication du build. Le build relit toujours `main`. L’URL de déclenchement reste dans les réglages des services.

Pour construire localement avec une copie autorisée : `EDITORIALS_SOURCE_DIR=/chemin/du/depot npm run build`. Cette option est explicitement refusée dans les builds hébergés Netlify. Tests : `node --test tests/editorial-access.test.mjs tests/editorial-source.test.mjs` et `npx tsc --noEmit`.

Une vérification HTTP authentifiée peut être exécutée pendant un build avec `FORGE_VERIFY_URL` pointant vers la production ou une URL de déploiement de ce site. Elle ne journalise ni mot de passe ni contenu et vérifie connexion, liste, article corrigé et absence de cache. Retirer cette variable après une vérification ponctuelle pour ne pas rendre les builds suivants dépendants d’un ancien déploiement.
