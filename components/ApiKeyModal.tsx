import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ onSave }) => {
  const [key, setKey] = useState('');
  // Check if env var exists
  useEffect(() => {
    if (process.env.API_KEY) {
        onSave(process.env.API_KEY);
    }
  }, [onSave]);

  if (process.env.API_KEY) return null;

  return (
    <div className="fixed inset-0 bg-paladin-dark/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white p-8 rounded shadow-2xl max-w-md w-full border-4 border-paladin-purple">
        <h2 className="text-2xl font-fantasy text-paladin-dark mb-4 text-center">Clé du Royaume Requise</h2>
        <p className="text-gray-600 mb-6 text-sm text-center">
          Pour accéder à la forge magique de Google Gemini, veuillez présenter votre clé API.
          <br/>
          <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-paladin-purple underline">Obtenir une clé ici</a>
        </p>
        
        <form onSubmit={(e) => { e.preventDefault(); onSave(key); }}>
          <input
            type="password"
            placeholder="AIzaSy..."
            className="w-full border-2 border-gray-300 p-3 rounded mb-4 font-mono text-sm focus:border-paladin-purple focus:outline-none"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
          <button 
            type="submit"
            className="w-full bg-paladin-purple text-paladin-cream font-bold py-3 uppercase tracking-widest hover:bg-paladin-dark transition-colors"
          >
            Entrer
          </button>
        </form>
      </div>
    </div>
  );
};
