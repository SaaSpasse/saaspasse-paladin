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

    // Try Gemini 2.0 Flash experimental (image generation)
    const models = [
      "gemini-2.0-flash-exp-image-generation",
      "imagen-3.0-generate-002"
    ];

    let lastError = null;

    for (const model of models) {
      try {
        console.log(`Trying model: ${model}`);

        let response;
        let data;

        if (model.startsWith("imagen")) {
          // Imagen API has different format
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                instances: [{ prompt: fullPrompt }],
                parameters: { sampleCount: 1 }
              }),
            }
          );
        } else {
          // Gemini format
          response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
        }

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Model ${model} failed:`, errorText);
          lastError = errorText;
          continue;
        }

        data = await response.json();

        // Extract image from response
        let imageData = null;
        let mimeType = "image/png";

        if (model.startsWith("imagen")) {
          // Imagen response format
          imageData = data.predictions?.[0]?.bytesBase64Encoded;
        } else {
          // Gemini response format
          const parts = data.candidates?.[0]?.content?.parts || [];
          for (const part of parts) {
            if (part.inlineData) {
              imageData = part.inlineData.data;
              mimeType = part.inlineData.mimeType || mimeType;
              break;
            }
          }
        }

        if (imageData) {
          return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageUrl: `data:${mimeType};base64,${imageData}`,
              modelUsed: model,
            }),
          };
        }
      } catch (e: any) {
        console.error(`Model ${model} error:`, e.message);
        lastError = e.message;
      }
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ error: `All models failed. Last error: ${lastError}` }),
    };
  } catch (error: any) {
    console.error("Function error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
