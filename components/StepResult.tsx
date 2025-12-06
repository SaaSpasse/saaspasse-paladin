
import React from 'react';

interface StepResultProps {
  imageUrl: string;
  scenePrompt: string;
  modelUsed?: string;
  downloadFilename: string;
  onReset: () => void;
  onEdit: () => void;
  onRegenerate: () => void;
}

export const StepResult: React.FC<StepResultProps> = ({ 
  imageUrl, 
  scenePrompt, 
  modelUsed, 
  downloadFilename,
  onReset,
  onEdit,
  onRegenerate
}) => {
  return (
    <div className="space-y-6 animate-fade-in text-center">
      <div className="border-b-2 border-paladin-dark/10 pb-4 mb-6 text-left flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-fantasy text-paladin-dark mb-2">Voici le résultat!</h2>
          <p className="text-gray-600 text-sm">
            Votre illustration est prête pour l'expédition.
          </p>
        </div>
        {modelUsed && (
          <div className="text-xs bg-paladin-purple/10 text-paladin-purple px-2 py-1 rounded border border-paladin-purple/20">
            Forgé avec : {modelUsed}
          </div>
        )}
      </div>

      <div className="flex justify-center mb-6">
        <div className="relative group p-2 bg-paladin-dark rounded-sm shadow-xl inline-block">
          <img 
            src={imageUrl} 
            alt="SaaSpaladin Generated" 
            className="max-w-full h-auto max-h-[500px] border-2 border-paladin-cream"
          />
           <div className="absolute inset-0 border-4 border-paladin-cream pointer-events-none opacity-20"></div>
        </div>
      </div>

      <div className="bg-gray-50 p-4 border border-gray-200 rounded text-left text-sm text-gray-600 mb-6 italic">
        " {scenePrompt} "
      </div>

      {/* Actions Principales */}
      <div className="flex flex-col sm:flex-row justify-center gap-3 border-b-2 border-paladin-dark/10 pb-6 mb-6">
        <button
          onClick={onRegenerate}
          className="px-6 py-2 bg-paladin-purple text-white font-fantasy shadow-md hover:bg-paladin-dark transition-all hover:-translate-y-1"
        >
          ↻ Régénérer (Même Prompt)
        </button>
        <button
          onClick={onEdit}
          className="px-6 py-2 border-2 border-paladin-purple text-paladin-purple font-fantasy hover:bg-paladin-purple/10 transition-colors"
        >
          ✎ Modifier le Prompt
        </button>
         <a
          href={imageUrl}
          download={downloadFilename}
          className="px-6 py-2 bg-paladin-green text-paladin-dark font-fantasy bg-[#00FF9B] border-2 border-paladin-dark shadow-[4px_4px_0px_0px_rgba(61,58,53,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Télécharger
        </a>
      </div>

      {/* Reset */}
      <div>
         <button
          onClick={onReset}
          className="text-sm text-gray-400 hover:text-paladin-dark underline transition-colors"
        >
          ← Recommencer depuis le début (Nouvelle Quête)
        </button>
      </div>
    </div>
  );
};
