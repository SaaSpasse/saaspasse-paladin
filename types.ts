
export interface GenerationState {
  step: 'landing' | 'idle' | 'analyzing' | 'review' | 'generating' | 'complete' | 'error';
  error?: string;
}

export interface AnalysisResult {
  theme: string;
  fantasyConcept: string;
  visualPrompt: string;
}

export interface PaladinConfig {
  // Config extensible
}

declare global {
  // Fix: Use AIStudio interface to avoid conflict with existing global type
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}
