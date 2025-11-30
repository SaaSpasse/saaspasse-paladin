
import React, { useRef } from 'react';

interface StepInputProps {
  newsletterText: string;
  setNewsletterText: (text: string) => void;
  onNext: () => void;
  isLoading: boolean;
}

export const StepInput: React.FC<StepInputProps> = ({ 
  newsletterText, 
  setNewsletterText, 
  onNext, 
  isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setNewsletterText(event.target.result as string);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="border-b-2 border-paladin-dark/10 pb-4 mb-6">
        <h2 className="text-2xl font-fantasy text-paladin-dark mb-2">Quelle histoire on raconte aujourd'hui?</h2>
        <p className="text-gray-600 text-sm">
          Déposez votre missive (newsletter) ci-dessous. Le AI Scribe l'analysera pour en extraire l'essence magique.
          <br/>
          <span className="text-paladin-purple text-xs italic opacity-80">* L'ancrage visuel du SaaSpaladin est géré automatiquement par la Forge (aka le back-end).</span>
        </p>
      </div>

      {/* Text Area */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-paladin-dark uppercase tracking-wide">
          Texte de la Newsletter
        </label>
        <textarea
          className="w-full h-48 p-4 border-2 border-gray-300 rounded-sm focus:border-paladin-purple focus:ring-0 font-mono text-sm resize-none bg-gray-50"
          placeholder="# Titre de la newsletter..."
          value={newsletterText}
          onChange={(e) => setNewsletterText(e.target.value)}
        />
        <div className="flex justify-between items-center">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-paladin-purple font-semibold hover:underline cursor-pointer flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Charger un fichier .txt ou .md
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".txt,.md" 
            onChange={handleFileUpload} 
          />
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          onClick={onNext}
          disabled={!newsletterText.trim() || isLoading}
          className="bg-paladin-purple text-white px-8 py-3 font-fantasy text-lg shadow-md hover:bg-paladin-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyse en cours...
            </>
          ) : (
            <>Extraire l'essence visuelle →</>
          )}
        </button>
      </div>
    </div>
  );
};