
import React, { useState } from 'react';

interface LandingProps {
  onConnected: (manualKey?: string) => void;
}

export const Landing: React.FC<LandingProps> = ({ onConnected }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [manualKey, setManualKey] = useState('');

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      if (window.aistudio?.openSelectKey) {
        await window.aistudio.openSelectKey();
        onConnected(); // Clé via process.env
      } else {
        alert("Impossible de contacter AI Studio. Utilisez l'entrée manuelle.");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Erreur de sélection de clé:", error);
      setIsLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualKey.trim().length > 10) {
      onConnected(manualKey.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8 animate-fade-in py-12">
      <div className="max-w-md mx-auto space-y-6">
        {/* Avatar SVG Large */}
        <div className="w-32 h-32 rounded-full border-4 border-paladin-dark bg-paladin-purple overflow-hidden shadow-[8px_8px_0px_0px_rgba(7,10,38,1)] mx-auto flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full">
             <rect width="100" height="100" fill="#853DFF" />
             <path d="M10 100 Q 50 70 90 100 L 90 100 L 10 100 Z" fill="#7E4874" />
             <path d="M20 100 Q 50 80 80 100" fill="none" stroke="#070A26" strokeWidth="2" />
             <rect x="25" y="15" width="50" height="70" rx="25" fill="#ECEBF1" stroke="#070A26" strokeWidth="3" />
             <rect x="38" y="35" width="8" height="25" rx="3" fill="#070A26" />
             <rect x="54" y="35" width="8" height="25" rx="3" fill="#070A26" />
             <path d="M35 25 L 40 28" stroke="#070A26" strokeWidth="1" opacity="0.5" />
           </svg>
        </div>
        
        <h2 className="text-2xl font-fantasy text-paladin-dark">Authentification Requise</h2>
        
        {!showManual ? (
          <>
            <p className="text-gray-600">
              Pour forger des illustrations avec le modèle <strong>Gemini 3 Pro</strong>, vous devez connecter une clé API valide.
            </p>

            <button
              onClick={handleConnect}
              disabled={isLoading}
              className="w-full bg-paladin-purple text-paladin-cream px-8 py-4 font-fantasy text-xl shadow-[8px_8px_0px_0px_rgba(61,58,53,1)] hover:translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 border-2 border-paladin-dark"
            >
              {isLoading ? (
                <span>Connexion...</span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                  </svg>
                  Connecter via Google
                </>
              )}
            </button>
            
            <button 
              onClick={() => setShowManual(true)}
              className="text-sm text-gray-500 hover:text-paladin-purple underline cursor-pointer pt-4"
            >
              J'ai déjà une clé API (Entrée manuelle)
            </button>
          </>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-4 bg-gray-50 p-6 rounded-sm border-2 border-paladin-dark/20">
            <label className="block text-left text-sm font-bold text-paladin-dark">Votre Clé API (Gemini)</label>
            <input 
              type="password" 
              value={manualKey}
              onChange={(e) => setManualKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full p-3 border border-gray-300 rounded focus:border-paladin-purple outline-none font-mono text-sm"
              required
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowManual(false)}
                className="flex-1 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 bg-paladin-dark text-white py-2 font-fantasy rounded hover:bg-black"
              >
                Valider
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};