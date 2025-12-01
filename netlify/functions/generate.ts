import type { Handler } from "@netlify/functions";

const SAASPALADIN_MASTER_PROMPT_FR = `
Petit chevalier SaaSpaladin, 1 m 20.
TÊTE : Casque couleur crème #F6F3EC sans visage, forme simple et lisse (type obus ou gélule). Sommet arrondi mais pas sphérique.
YEUX : Deux fentes verticales noires #000000 (12×2 cm) parallèles. Pas d'autre ouverture.
CORPS : Cape violette usée #7E4874, armure patinée ivoire #D5D0C6 sur mailles sombres, gants et bottes cuir brun #6B4B30.
STYLE : Illustration ligne claire franco-belge, hachures fines, style Moebius x Mike Mignola. Couleurs saturées mais terreuses, pas de dégradés numériques. Éclairage dramatique unique.
`;

const NEGATIVE_PROMPT = `
visière horizontale, T-shaped visor, Mandalorian,
tête de boule, sphere head, ball head, bubble head,
casque pointu, sharp angles, spiky helmet, square helmet,
peau visible, skin visible, human chin, human nose, human neck, mouth,
glossy 3D, cartoon kawaii, Pixar, vector art, smooth gradients, photo realistic, futuristic sci-fi, low poly, blur.
`;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  // Vérifier le mot de passe
  const password = event.headers["x-paladin-secret"];
  const expectedPassword = process.env.PALADIN_SECRET;
  if (!expectedPassword || password !== expectedPassword) {
    return { statusCode: 401, body: JSON.stringify({ error: "Mot de passe invalide" }) };
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API_KEY not configured" }) };
  }

  try {
    const { scenePrompt } = JSON.parse(event.body || "{}");
    if (!scenePrompt) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing scenePrompt parameter" }) };
    }

    const fullPrompt = `
      ${SAASPALADIN_MASTER_PROMPT_FR}
      SCÈNE: ${scenePrompt}

      --no ${NEGATIVE_PROMPT}
    `.trim();

    // Stratégie de Fallback : Essayer Pro, si échec, essayer Flash
    const models = [
      { name: "gemini-3-pro-image-preview", label: "Gemini 3 Pro (Haute Qualité)" },
      { name: "gemini-2.5-flash-preview-05-20", label: "Gemini 2.5 Flash (Mode Rapide)" },
    ];

    let lastError = null;

    for (const model of models) {
      try {
        console.log(`Trying model: ${model.name}`);

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model.name}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: fullPrompt }] }],
              generationConfig: {
                responseModalities: ["image", "text"],
              },
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Model ${model.name} failed:`, errorText);
          lastError = errorText;
          continue;
        }

        const data = await response.json();

        // Extract image from response
        const parts = data.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
          if (part.inlineData) {
            return {
              statusCode: 200,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                imageUrl: `data:${part.inlineData.mimeType || "image/png"};base64,${part.inlineData.data}`,
                modelUsed: model.label,
              }),
            };
          }
        }
      } catch (e: any) {
        console.error(`Model ${model.name} error:`, e.message);
        lastError = e.message;
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: `Tous les modèles ont échoué. Dernière erreur: ${lastError}` }),
    };
  } catch (error: any) {
    console.error("Function error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
