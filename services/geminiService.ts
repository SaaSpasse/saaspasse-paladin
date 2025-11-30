
import { GoogleGenAI, Type } from "@google/genai";
import { SAASPALADIN_MASTER_PROMPT_FR, NEGATIVE_PROMPT, SYSTEM_INSTRUCTION_ANALYSIS, SAASPALADIN_REF_IMAGE } from "../constants";
import { AnalysisResult } from "../types";

export class GeminiService {
  private apiKey: string | undefined;

  constructor(manualKey?: string) {
    // Priorité à la clé manuelle, sinon celle de l'environnement (injectée par IDX/AI Studio)
    this.apiKey = manualKey || process.env.API_KEY;
  }

  private getClient(): GoogleGenAI {
    if (!this.apiKey) {
      throw new Error("Clé API manquante. Veuillez connecter un projet ou entrer une clé.");
    }
    return new GoogleGenAI({ apiKey: this.apiKey });
  }
  
  // Step 2: Analyze Text and Create Scene Concept
  async analyzeNewsletter(text: string): Promise<AnalysisResult> {
    try {
      const ai = this.getClient();
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Voici le contenu de la newsletter :\n\n${text}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION_ANALYSIS,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              theme: { type: Type.STRING },
              fantasyConcept: { type: Type.STRING },
              visualPrompt: { type: Type.STRING },
            },
            required: ["theme", "fantasyConcept", "visualPrompt"],
          },
        },
      });

      if (!response.text) {
        throw new Error("Réponse vide du modèle d'analyse.");
      }

      return JSON.parse(response.text) as AnalysisResult;
    } catch (error: any) {
      console.error("Erreur lors de l'analyse:", error);
      throw new Error(`Impossible d'analyser le texte : ${error.message}`);
    }
  }

  // Step 3: Generate Image using Prompt Sandwich + Hidden Reference Image
  async generateIllustration(sceneDescription: string): Promise<{ imageUrl: string, modelUsed: string }> {
    const ai = this.getClient();

    // Construction du Prompt Sandwich
    const fullPrompt = `
      ${SAASPALADIN_MASTER_PROMPT_FR}
      SCÈNE: ${sceneDescription}
      
      --no ${NEGATIVE_PROMPT}
    `.trim();

    const parts: any[] = [{ text: fullPrompt }];

    // Injection de l'image de référence "Back-end"
    if (SAASPALADIN_REF_IMAGE && SAASPALADIN_REF_IMAGE.length > 100) {
      const base64Clean = SAASPALADIN_REF_IMAGE.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");
      parts.push({
        inlineData: {
          mimeType: 'image/png',
          data: base64Clean
        }
      });
    }

    // Stratégie de Fallback : Essayer Pro, si échec (403/Permission), essayer Flash
    try {
      console.log("Tentative avec Gemini 3 Pro Image...");
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: { parts: parts },
        config: {}
      });
      return { 
        imageUrl: this.extractImage(response), 
        modelUsed: 'Gemini 3 Pro (Haute Qualité)' 
      };

    } catch (error: any) {
      console.warn("Échec Gemini 3 Pro, basculement vers Flash...", error);
      
      // Si l'erreur est une permission ou un quota, on tente le modèle Flash
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image', // Modèle de secours plus rapide/permissif
          contents: { parts: parts },
          config: {}
        });
        return { 
          imageUrl: this.extractImage(response), 
          modelUsed: 'Gemini 2.5 Flash (Mode Rapide)' 
        };
      } catch (flashError: any) {
        console.error("Échec complet de la génération d'image:", flashError);
        throw new Error("Impossible de générer l'image, même avec le modèle rapide. Vérifiez votre clé API.");
      }
    }
  }

  private extractImage(response: any): string {
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("Aucune image générée.");
    }
    for (const part of candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Format de réponse d'image inattendu.");
  }
}
