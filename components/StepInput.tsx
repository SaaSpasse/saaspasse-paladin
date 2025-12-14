
import React, { useRef, useState, useEffect } from 'react';

interface Editorial {
  filename: string;
  date: string;
  title: string;
  slug: string;
}

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
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [editoriaux, setEditoriaux] = useState<Editorial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingEditoriaux, setIsLoadingEditoriaux] = useState(true);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch editoriaux on mount
  useEffect(() => {
    const fetchEditoriaux = async () => {
      try {
        const response = await fetch('/.netlify/functions/editoriaux');
        if (response.ok) {
          const data = await response.json();
          setEditoriaux(data);
        }
      } catch (error) {
        console.error('Error fetching editoriaux:', error);
      } finally {
        setIsLoadingEditoriaux(false);
      }
    };
    fetchEditoriaux();
  }, []);

  // Filter editoriaux based on search (show all if empty query)
  const filteredEditoriaux = searchQuery.trim()
    ? editoriaux.filter(e =>
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.date.includes(searchQuery)
      )
    : editoriaux;

  const handleSelectEditorial = async (editorial: Editorial) => {
    setIsLoadingContent(true);
    setShowDropdown(false);
    setSearchQuery(editorial.title);

    try {
      // Ajouter cache-buster pour éviter les réponses vides cachées
      const cacheBust = Date.now();
      const response = await fetch(`/.netlify/functions/editorial-content?filename=${encodeURIComponent(editorial.filename)}&_t=${cacheBust}`);
      if (response.ok) {
        const data = await response.json();
        setNewsletterText(data.content);
      }
    } catch (error) {
      console.error('Error fetching editorial content:', error);
    } finally {
      setIsLoadingContent(false);
    }
  };

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
          Sélectionnez un éditorial existant ou déposez votre missive ci-dessous.
          <br/>
          <span className="text-paladin-purple text-xs italic opacity-80">* L'ancrage visuel du SaaSpaladin est géré automatiquement par la Forge.</span>
        </p>
      </div>

      {/* Editorial Search */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-bold text-paladin-dark uppercase tracking-wide">
            Charger un éditorial existant
          </label>
          {!isLoadingEditoriaux && editoriaux.length > 0 && (
            <span className="text-xs bg-paladin-purple/10 text-paladin-purple px-2 py-1 rounded-full font-medium">
              {editoriaux.length} éditoriaux
            </span>
          )}
        </div>
        <div className="relative" ref={dropdownRef}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder={isLoadingEditoriaux ? "Chargement des éditoriaux..." : "Cliquer pour voir vos éditoriaux ou taper pour filtrer..."}
              disabled={isLoadingEditoriaux}
              className="w-full p-3 pr-10 border-2 border-gray-300 rounded-sm focus:border-paladin-purple focus:ring-0 text-sm bg-gray-50"
            />
            {isLoadingContent ? (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-6 w-6 text-paladin-purple" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && filteredEditoriaux.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border-2 border-paladin-dark rounded-sm shadow-lg max-h-60 overflow-y-auto">
              {!searchQuery.trim() && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Vos éditoriaux récents
                </div>
              )}
              {searchQuery.trim() && (
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {filteredEditoriaux.length} résultat{filteredEditoriaux.length > 1 ? 's' : ''} pour "{searchQuery}"
                </div>
              )}
              {filteredEditoriaux.slice(0, 10).map((editorial) => (
                <button
                  key={editorial.filename}
                  onClick={() => handleSelectEditorial(editorial)}
                  className="w-full px-4 py-3 text-left hover:bg-paladin-purple/10 border-b border-gray-100 last:border-b-0 transition-colors"
                >
                  <div className="font-medium text-paladin-dark">{editorial.title}</div>
                  <div className="text-xs text-gray-500">{editorial.date}</div>
                </button>
              ))}
            </div>
          )}
          {showDropdown && filteredEditoriaux.length === 0 && !isLoadingEditoriaux && (
            <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-sm shadow-lg">
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                {searchQuery.trim()
                  ? `Aucun éditorial trouvé pour "${searchQuery}"`
                  : "Aucun éditorial disponible"
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Text Area */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-paladin-dark uppercase tracking-wide">
          Texte de la Newsletter
        </label>
        <textarea
          className="w-full h-48 p-4 border-2 border-gray-300 rounded-sm focus:border-paladin-purple focus:ring-0 font-mono text-sm resize-none bg-gray-50 disabled:opacity-60 disabled:cursor-wait"
          placeholder={isLoadingContent ? "Chargement de l'éditorial..." : "# Titre de la newsletter..."}
          value={newsletterText}
          onChange={(e) => setNewsletterText(e.target.value)}
          disabled={isLoadingContent}
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
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
