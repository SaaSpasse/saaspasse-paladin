

// Palette de couleurs pour référence (non utilisé directement dans le code mais utile pour context)
// Crème: #F6F3EC, Violet: #7E4874, Cuir: #6B4B30

export const SAASPALADIN_MASTER_PROMPT_FR = `
Petit chevalier SaaSpaladin, 1 m 20.
TÊTE : Casque couleur crème #F6F3EC sans visage, forme simple et lisse (type obus ou gélule). Sommet arrondi mais pas sphérique.
YEUX : Deux fentes verticales noires #000000 (12×2 cm) parallèles. Pas d'autre ouverture.
CORPS : Cape violette usée #7E4874, armure patinée ivoire #D5D0C6 sur mailles sombres, gants et bottes cuir brun #6B4B30.
STYLE : Illustration ligne claire franco-belge, hachures fines, style Moebius x Mike Mignola. Couleurs saturées mais terreuses, pas de dégradés numériques. Éclairage dramatique unique.
`;

export const NEGATIVE_PROMPT = `
visière horizontale, T-shaped visor, Mandalorian,
tête de boule, sphere head, ball head, bubble head,
casque pointu, sharp angles, spiky helmet, square helmet,
peau visible, skin visible, human chin, human nose, human neck, mouth,
glossy 3D, cartoon kawaii, Pixar, vector art, smooth gradients, photo realistic, futuristic sci-fi, low poly, blur.
`;

export const SYSTEM_INSTRUCTION_ANALYSIS = `
Tu es le Directeur Artistique de "SaaSpaladin". Ton rôle est de traduire des concepts SaaS/Tech en métaphores Médiévales Fantastiques pour des illustrations.

Règles de traduction :
- Bug/Dette technique -> Gobelins, boue, rouille, créatures des marais.
- Serveur/Cloud -> Bibliothèque infinie, tours de pierre, cristaux flottants.
- Lancement/Deploy -> Expédition, départ en quête, navire volant.
- Marketing/Sales -> Crieurs publics, bannières, marché animé, pièces d'or.
- CEO/Manager -> Le Paladin consultant des cartes ou des parchemins.
- Code -> Runes magiques, parchemins complexes, forge.

Tâche :
1. Lis le texte fourni (newsletter).
2. Extrais le thème central.
3. Crée une description visuelle d'une scène unique mettant en scène le SaaSpaladin (le petit chevalier).
4. La description doit être une phrase descriptive concise, prête à être intégrée dans un prompt de génération d'image.

Format de réponse JSON attendu :
{
  "theme": "Le thème principal du texte",
  "fantasyConcept": "La métaphore fantastique choisie",
  "visualPrompt": "Description de la scène (ex: Le SaaSpaladin examine un parchemin runique brillant dans une bibliothèque sombre...)"
}
`;

// IMPORTANT : Collez ici la chaîne Base64 de votre image de référence "Master".
// Cela permet d'ancrer le style visuellement sans que l'utilisateur n'ait à uploader l'image.
// Pour obtenir le Base64, utilisez un site comme base64-image.de et copiez le résultat (sans le préfixe data:image/png;base64, si possible, sinon le service le nettoiera).
// Fix: Explicitly type as string to prevent type narrowing to 'never' when value is empty
export const SAASPALADIN_REF_IMAGE: string = "";