import { AnalysisResult } from "../types";

const getSecret = (): string | null => {
  return localStorage.getItem("paladin_secret");
};

export const setSecret = (secret: string): void => {
  localStorage.setItem("paladin_secret", secret);
};

export const clearSecret = (): void => {
  localStorage.removeItem("paladin_secret");
};

export const hasSecret = (): boolean => {
  return !!localStorage.getItem("paladin_secret");
};

export class GeminiService {
  constructor() {}

  async analyzeNewsletter(text: string): Promise<AnalysisResult> {
    const secret = getSecret();
    if (!secret) {
      throw new Error("Mot de passe requis");
    }

    try {
      const response = await fetch("/.netlify/functions/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Paladin-Secret": secret,
        },
        body: JSON.stringify({ text }),
      });

      if (response.status === 401) {
        clearSecret();
        throw new Error("Mot de passe invalide");
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur d'analyse");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Erreur lors de l'analyse:", error);
      if (error.message?.includes("is not valid JSON") || error.message?.includes("Unexpected token")) {
        throw new Error("Navigateur non supporté. Essayez avec Chrome ou Firefox.");
      }
      throw new Error(error.message || "Impossible d'analyser le texte");
    }
  }

  async generateIllustration(scenePrompt: string): Promise<{ imageUrl: string; modelUsed: string }> {
    const secret = getSecret();
    if (!secret) {
      throw new Error("Mot de passe requis");
    }

    try {
      const response = await fetch("/.netlify/functions/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Paladin-Secret": secret,
        },
        body: JSON.stringify({ scenePrompt }),
      });

      if (response.status === 401) {
        clearSecret();
        throw new Error("Mot de passe invalide");
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur de génération");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Erreur lors de la génération:", error);
      if (error.message?.includes("is not valid JSON") || error.message?.includes("Unexpected token")) {
        throw new Error("Navigateur non supporté. Essayez avec Chrome ou Firefox.");
      }
      throw new Error(error.message || "Impossible de générer l'image");
    }
  }
}
