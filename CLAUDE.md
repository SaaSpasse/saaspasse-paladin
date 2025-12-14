# La Forge du SaaSpaladin

## Vue d'ensemble

Générateur d'images header pour la newsletter beehiiv de SaaSpasse. L'application utilise l'IA (Gemini) pour analyser le texte d'un éditorial et générer une illustration mettant en scène le personnage "SaaSpaladin" - un petit chevalier de 1m20 au casque crème sans visage.

**URL Production:** https://paladin.saaspasse.com
**Mot de passe:** Voir variable `PALADIN_SECRET` dans Netlify env vars
**Repo:** https://github.com/SaaSpasse/saaspasse-paladin

## Stack technique

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS
- **Backend:** Netlify Functions (serverless)
- **IA:** Google Gemini API (analyse + génération d'images)
- **Déploiement:** Netlify (auto-deploy depuis GitHub)
- **Source des éditoriaux:** GitHub raw (SaaSpasse/saaspasse-editoriaux)

## Structure du projet

```
├── App.tsx                 # Composant principal, gestion des états et flow
├── components/
│   ├── Layout.tsx          # Layout avec header/footer
│   ├── StepInput.tsx       # Étape 1: Sélection éditorial + texte
│   ├── StepReview.tsx      # Étape 2: Review du prompt visuel
│   └── StepResult.tsx      # Étape 3: Image générée + téléchargement
├── constants.ts            # Prompts système, palette couleurs SaaSpaladin
├── services/
│   └── geminiService.ts    # Client API Gemini
├── netlify/functions/
│   ├── analyze.ts          # Analyse newsletter → prompt visuel
│   ├── generate.ts         # Génération image via Gemini
│   ├── editoriaux.ts       # Liste des éditoriaux disponibles
│   ├── editorial-content.ts # Contenu d'un éditorial spécifique
│   └── ref-image.ts        # Image de référence du SaaSpaladin (base64)
└── types.ts                # Types TypeScript
```

## Flow utilisateur

1. **Authentification** → Mot de passe (voir Netlify env vars)
2. **Input** → Sélectionner un éditorial existant OU coller/uploader du texte
3. **Analyse** → Gemini extrait le thème et crée une métaphore médiévale
4. **Review** → L'utilisateur peut modifier le prompt visuel
5. **Génération** → Gemini génère l'illustration du SaaSpaladin
6. **Téléchargement** → Image PNG prête pour beehiiv

## Le personnage SaaSpaladin

Petit chevalier de 1m20 avec:
- Casque crème (#F6F3EC) sans visage, forme obus/gélule
- Deux fentes verticales noires pour les yeux
- Cape violette usée (#7E4874)
- Armure ivoire patinée (#D5D0C6)
- Gants et bottes cuir brun (#6B4B30)

**Style:** Ligne claire franco-belge, hachures fines (Moebius x Mike Mignola)

## Métaphores tech → médiéval

| Concept Tech | Métaphore Fantasy |
|--------------|-------------------|
| Bug/Dette technique | Gobelins, boue, rouille, créatures des marais |
| Serveur/Cloud | Bibliothèque infinie, tours de pierre, cristaux |
| Lancement/Deploy | Expédition, quête, navire volant |
| Marketing/Sales | Crieurs publics, bannières, marché, pièces d'or |
| CEO/Manager | Le Paladin consultant cartes ou parchemins |
| Code | Runes magiques, parchemins, forge |

## Préférences Claude

- **Mots de passe et clés API:** Ne jamais afficher en clair. Toujours tronquer/masquer (ex: `GRE***`) et indiquer où trouver la valeur complète.

## Variables d'environnement

```
GEMINI_API_KEY=xxx          # Clé API Google Gemini (voir Netlify)
FORGE_PASSWORD=***          # Mot de passe d'accès (voir Netlify env vars)
```

## Commandes

```bash
npm install     # Installation des dépendances
npm run dev     # Développement local (Vite)
npm run build   # Build production
git push        # Déclenche auto-deploy sur Netlify
```

## Notes de développement

- Les titres d'éditoriaux sont affichés en **Sentence case** dans le dropdown
- Le dropdown s'ouvre au focus/clic (pas besoin de taper)
- L'image de référence du SaaSpaladin est intégrée en base64 dans `ref-image.ts`
- Les éditoriaux sont fetchés depuis le repo GitHub SaaSpasse/saaspasse-editoriaux

---

## Troubleshooting & Leçons apprises

### Le texte de l'éditorial ne se charge pas dans la zone de texte

**Symptôme:** On sélectionne un éditorial dans le dropdown, le titre s'affiche, mais la zone de texte reste vide et le bouton "Extraire l'essence visuelle" reste désactivé.

**Diagnostic:**
1. Ouvrir les DevTools (F12) > Network
2. Chercher la requête `editorial-content?filename=...`
3. Vérifier la réponse: si `{"content":""}`, le fichier est vide sur GitHub

**Causes possibles:**

1. **Fichier vide sur GitHub** - Le script de conversion dans `posts-infolettre` n'a pas extrait le contenu (voir troubleshooting dans ce repo)

2. **Cache Netlify avec réponse vide** - Une ancienne requête avec contenu vide a été cachée

**Solutions implémentées (2024-12):**
- `StepInput.tsx`: Cache-buster ajouté (`&_t=timestamp`) pour forcer le refresh
- `editorial-content.ts`: Ne cache plus les réponses vides (`no-cache, no-store`)

### Vérifier le contenu d'un éditorial via l'API

```bash
# Directement via GitHub (source de vérité)
gh api repos/SaaSpasse/saaspasse-editoriaux/contents/editoriaux/<fichier>.md --jq '.size'

# Via la fonction Netlify (avec cache-buster)
curl "https://paladin.saaspasse.com/.netlify/functions/editorial-content?filename=<fichier>.md&_t=$(date +%s)"
```

### L'éditorial existe sur GitHub mais pas dans le dropdown

**Cause:** La fonction `editoriaux.ts` liste les fichiers depuis GitHub. Le cache est de 5 minutes.

**Solution:** Attendre 5 minutes ou ajouter un cache-buster similaire à `editorial-content`.

### Architecture du système de cache

```
GitHub (source)
    ↓
editorial-content.ts (Cache-Control: 1h si contenu valide, no-cache si vide)
    ↓
StepInput.tsx (cache-buster &_t=timestamp)
    ↓
UI
```
