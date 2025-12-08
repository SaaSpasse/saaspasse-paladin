import type { Handler } from "@netlify/functions";

const GITHUB_REPO = "SaaSpasse/saaspasse-editoriaux";
const EDITORIAUX_PATH = "editoriaux";

interface GitHubFile {
  name: string;
  path: string;
  type: string;
}

interface Editorial {
  filename: string;
  date: string;
  title: string;
  slug: string;
}

// Convertit un slug en titre lisible (Sentence case avec apostrophes françaises)
// Supporte les caractères accentués (é, è, ê, à, ù, û, ô, î, ï, ç, etc.)
function slugToTitle(slug: string): string {
  // Articles élidés français qui doivent être suivis d'une apostrophe
  const elidedArticles = ['l', 'd', 'n', 'c', 'j', 'm', 't', 's', 'qu'];

  const words = slug.split("-");
  const result: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const nextWord = words[i + 1];

    // Si c'est un article élidé suivi d'un autre mot, on fusionne avec apostrophe
    if (nextWord && elidedArticles.includes(word.toLowerCase())) {
      // Capitalize le premier mot de la phrase, sinon minuscule
      const prefix = result.length === 0
        ? capitalizeFirst(word)
        : word.toLowerCase();
      result.push(prefix + "'" + nextWord.toLowerCase());
      i++; // Skip le mot suivant car il est fusionné
    } else {
      // Sentence case: majuscule seulement au premier mot
      if (result.length === 0) {
        result.push(capitalizeFirst(word));
      } else {
        result.push(word.toLowerCase());
      }
    }
  }

  return result.join(" ");
}

// Capitalize la première lettre d'un mot (supporte les caractères accentués)
function capitalizeFirst(word: string): string {
  if (!word) return word;
  // Utilise toLocaleUpperCase pour gérer correctement les accents (é → É, etc.)
  return word.charAt(0).toLocaleUpperCase('fr-FR') + word.slice(1).toLowerCase();
}

function parseFilename(filename: string): Editorial | null {
  // Format: YYYY-MM-DD-titre-slug.md
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  if (!match) return null;

  const [, date, slug] = match;
  const title = slugToTitle(slug);

  return { filename, date, title, slug };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${EDITORIAUX_PATH}`,
      {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "SaaSpaladin-Forge",
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("GitHub API error:", error);
      return { statusCode: response.status, body: JSON.stringify({ error: "GitHub API error" }) };
    }

    const files: GitHubFile[] = await response.json();

    const editoriaux = files
      .filter(f => f.type === "file" && f.name.endsWith(".md"))
      .map(f => parseFilename(f.name))
      .filter((e): e is Editorial => e !== null)
      .sort((a, b) => b.date.localeCompare(a.date)); // Most recent first

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300", // Cache 5 min
      },
      body: JSON.stringify(editoriaux),
    };
  } catch (error: any) {
    console.error("Function error:", error);
    return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
  }
};
