
import React from 'react';
import { AnalysisResult } from '../types';

interface StepReviewProps {
  analysis: AnalysisResult;
  scenePrompt: string;
  setScenePrompt: (prompt: string) => void;
  onGenerate: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export const StepReview: React.FC<StepReviewProps> = ({
  analysis,
  scenePrompt,
  setScenePrompt,
  onGenerate,
  onBack,
  isLoading
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b-2 border-paladin-dark/10 pb-4 mb-6">
        <h2 className="text-2xl font-fantasy text-paladin-dark mb-2">Quelle scène est-ce qu'on dessine?</h2>
        <p className="text-gray-600 text-sm">
          L'esprit de la forge a parlé. Vérifiez et ajustez la vision avant de lancer le sortilège de création.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 border border-blue-100 rounded-sm">
          <span className="text-xs font-bold text-blue-800 uppercase">Thème Détecté</span>
          <p className="text-blue-900 font-medium mt-1">{analysis.theme}</p>
        </div>
        <div className="bg-purple-50 p-4 border border-purple-100 rounded-sm">
          <span className="text-xs font-bold text-purple-800 uppercase">Concept Fantasy</span>
          <p className="text-purple-900 font-medium mt-1">{analysis.fantasyConcept}</p>
        </div>
      </div>

      <div className="space-y-2">
         <label className="block text-sm font-bold text-paladin-dark uppercase tracking-wide">
          Description de la Scène (Éditable)
        </label>
        <div className="relative">
          <textarea
            className="w-full h-32 p-4 border-2 border-paladin-purple/50 bg-white rounded-sm focus:border-paladin-purple focus:ring-0 text-base shadow-inner resize-none"
            value={scenePrompt}
            onChange={(e) => setScenePrompt(e.target.value)}
          />
        </div>
        <p className="text-xs text-gray-500 italic">
          * Le style visuel et l'apparence du personnage sont ajoutés automatiquement. Ne décrivez que l'action et le décor.
        </p>
      </div>

      <div className="pt-6 flex justify-between items-center border-t-2 border-paladin-dark/10">
        <button
          onClick={onBack}
          disabled={isLoading}
          className="text-paladin-dark underline hover:text-paladin-purple font-medium text-sm disabled:opacity-50"
        >
          ← Retour au texte
        </button>
        <button
          onClick={onGenerate}
          disabled={!scenePrompt.trim() || isLoading}
          className="bg-paladin-purple text-paladin-cream px-8 py-3 font-fantasy text-lg shadow-md hover:bg-paladin-dark transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
           {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Forgeage de l'image...
            </>
          ) : (
            <>✨ Générer l'Illustration</>
          )}
        </button>
      </div>
    </div>
  );
};
