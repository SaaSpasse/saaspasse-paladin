import type { Handler } from "@netlify/functions";

const GITHUB_REPO = "SaaSpasse/saaspasse-editoriaux";
const EDITORIAUX_PATH = "editoriaux";
const POSTS_COMPLETS_PATH = "posts-complets";

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

// Fallback: convertit un slug en titre lisible
function slugToTitle(slug: string): string {
  const elidedArticles = ['l', 'd', 'n', 'c', 'j', 'm', 't', 's', 'qu'];
  const words = slug.split("-");
  const result: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const nextWord = words[i + 1];

    if (nextWord && elidedArticles.includes(word.toLowerCase())) {
      const prefix = result.length === 0
        ? word.charAt(0).toLocaleUpperCase('fr-FR') + word.slice(1).toLowerCase()
        : word.toLowerCase();
      result.push(prefix + "'" + nextWord.toLowerCase());
      i++;
    } else {
      if (result.length === 0) {
        result.push(word.charAt(0).toLocaleUpperCase('fr-FR') + word.slice(1).toLowerCase());
      } else {
        result.push(word.toLowerCase());
      }
    }
  }
  return result.join(" ");
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // 1. Récupérer la liste des fichiers dans editoriaux/ (source de vérité)
    const listResponse = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${EDITORIAUX_PATH}`,
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

    // 2. Pour chaque éditorial, chercher le titre dans posts-complets/ (frontmatter)
    const editoriaux: Editorial[] = [];

    await Promise.all(
      mdFiles.map(async (file) => {
        const parsed = parseFilename(file.name);
        if (!parsed) return;

        let title: string | null = null;

        // Essayer de récupérer le titre depuis posts-complets/
        try {
          const contentResponse = await fetch(
            `https://raw.githubusercontent.com/${GITHUB_REPO}/main/${POSTS_COMPLETS_PATH}/${file.name}`,
            { headers: { "User-Agent": "SaaSpaladin-Forge" } }
          );

          if (contentResponse.ok) {
            const content = await contentResponse.text();
            title = extractTitleFromFrontmatter(content);
          }
        } catch (err) {
          console.error(`Error fetching title for ${file.name}:`, err);
        }

        // Fallback: générer le titre depuis le slug
        if (!title) {
          title = slugToTitle(parsed.slug);
        }

        editoriaux.push({
          filename: file.name,
          date: parsed.date,
          title: title,
          slug: parsed.slug,
        });
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
