import type { Handler } from "@netlify/functions";

const GITHUB_REPO = "SaaSpasse/saaspasse-editoriaux";
const POSTS_COMPLETS_PATH = "posts-complets";

interface GitHubFile {
  name: string;
  path: string;
  type: string;
  download_url: string;
}

interface Editorial {
  filename: string;
  date: string;
  title: string;
  slug: string;
}

// Extrait le titre du frontmatter YAML d'un fichier markdown
function extractTitleFromFrontmatter(content: string): string | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatter = frontmatterMatch[1];
  // Cherche title: "..." ou title: '...' ou title: ...
  const titleMatch = frontmatter.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  return titleMatch ? titleMatch[1] : null;
}

// Parse le nom de fichier pour extraire date et slug
function parseFilename(filename: string): { date: string; slug: string } | null {
  const match = filename.match(/^(\d{4}-\d{2}-\d{2})-(.+)\.md$/);
  if (!match) return null;
  return { date: match[1], slug: match[2] };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 1. Récupérer la liste des fichiers dans posts-complets/
    const listResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${POSTS_COMPLETS_PATH}`,
      {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "SaaSpaladin-Forge",
        },
      }
    );

    if (!listResponse.ok) {
      const error = await listResponse.text();
      console.error("GitHub API error:", error);
      return { statusCode: listResponse.status, body: JSON.stringify({ error: "GitHub API error" }) };
    }

    const files: GitHubFile[] = await listResponse.json();
    const mdFiles = files.filter(f => f.type === "file" && f.name.endsWith(".md"));

    // 2. Récupérer le contenu de chaque fichier pour extraire le titre du frontmatter
    const editoriaux: Editorial[] = [];

    await Promise.all(
      mdFiles.map(async (file) => {
        const parsed = parseFilename(file.name);
        if (!parsed) return;

        try {
          // Fetch le contenu du fichier (juste les premiers bytes pour le frontmatter)
          const contentResponse = await fetch(file.download_url, {
            headers: { "User-Agent": "SaaSpaladin-Forge" },
          });

          if (contentResponse.ok) {
            const content = await contentResponse.text();
            const title = extractTitleFromFrontmatter(content);

            if (title) {
              editoriaux.push({
                filename: file.name,
                date: parsed.date,
                title: title,
                slug: parsed.slug,
              });
            }
          }
        } catch (err) {
          console.error(`Error fetching ${file.name}:`, err);
        }
      })
    );

    // Trier par date décroissante
    editoriaux.sort((a, b) => b.date.localeCompare(a.date));

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
