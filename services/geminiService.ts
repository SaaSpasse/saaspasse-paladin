import { AnalysisResult } from "../types";

export class GeminiService {
  // No API key needed - calls go through Netlify Functions
  constructor() {}

  async analyzeNewsletter(text: string): Promise<AnalysisResult> {
    try {
      const response = await fetch("/.netlify/functions/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur d'analyse");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Erreur lors de l'analyse:", error);
      throw new Error(`Impossible d'analyser le texte : ${error.message}`);
    }
  }

  async generateIllustration(scenePrompt: string): Promise<{ imageUrl: string; modelUsed: string }> {
    try {
      const response = await fetch("/.netlify/functions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenePrompt }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur de génération");
      }

      return await response.json();
    } catch (error: any) {
      console.error("Erreur lors de la génération:", error);
      throw new Error(`Impossible de générer l'image : ${error.message}`);
    }
  }
}
