import type { Handler } from "@netlify/functions";

const SYSTEM_INSTRUCTION_ANALYSIS = `
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

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "API_KEY not configured" }) };
  }

  try {
    const { text } = JSON.parse(event.body || "{}");
    if (!text) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing text parameter" }) };
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION_ANALYSIS }] },
          contents: [{ parts: [{ text: `Voici le contenu de la newsletter :\n\n${text}` }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                theme: { type: "STRING" },
                fantasyConcept: { type: "STRING" },
                visualPrompt: { type: "STRING" },
              },
              required: ["theme", "fantasyConcept", "visualPrompt"],
            },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Gemini API error:", error);
      return { statusCode: response.status, body: JSON.stringify({ error: "Gemini API error" }) };
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      return { statusCode: 500, body: JSON.stringify({ error: "Empty response from Gemini" }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: resultText,
    };
  } catch (error: any) {
    console.error("Function error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
