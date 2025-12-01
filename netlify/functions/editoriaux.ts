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

function parseFilename(filename: string): Editorial | null {
  // Format: YYYY-MM-DD-titre-slug.md
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  if (!match) return null;

  const [, date, slug] = match;
  // Convert slug to title (replace dashes with spaces, capitalize)
  const title = slug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

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
