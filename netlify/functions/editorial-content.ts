import type { Handler } from "@netlify/functions";

const GITHUB_REPO = "SaaSpasse/saaspasse-editoriaux";
const EDITORIAUX_PATH = "editoriaux";

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const filename = event.queryStringParameters?.filename;
  if (!filename) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing filename parameter" }) };
  }

  // Validate filename format to prevent path traversal
  if (!filename.match(/^\d{4}-\d{2}-\d{2}-.+\.md$/)) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid filename format" }) };
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${EDITORIAUX_PATH}/${filename}`,
      {
        headers: {
          "Accept": "application/vnd.github.v3.raw",
          "User-Agent": "SaaSpaladin-Forge",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { statusCode: 404, body: JSON.stringify({ error: "Editorial not found" }) };
      }
      const error = await response.text();
      console.error("GitHub API error:", error);
      return { statusCode: response.status, body: JSON.stringify({ error: "GitHub API error" }) };
    }

    const content = await response.text();

    // Ne pas cacher si le contenu est vide (fichier corrompu/incomplet)
    const cacheControl = content.trim().length > 0
      ? "public, max-age=3600" // Cache 1 hour si contenu valide
      : "no-cache, no-store";  // Pas de cache si vide

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": cacheControl,
      },
      body: JSON.stringify({ content }),
    };
  } catch (error: any) {
    console.error("Function error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
