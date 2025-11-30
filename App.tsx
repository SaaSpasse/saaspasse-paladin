
import React, { useState, useCallback, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StepInput } from './components/StepInput';
import { StepReview } from './components/StepReview';
import { StepResult } from './components/StepResult';
import { Landing } from './components/Landing';
import { GeminiService } from './services/geminiService';
import { AnalysisResult, GenerationState } from './types';

const App: React.FC = () => {
  const [state, setState] = useState<GenerationState>({ step: 'landing' });
  const [apiKey, setApiKey] = useState<string | undefined>(undefined);
  
  // Data State
  const [newsletterText, setNewsletterText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [scenePrompt, setScenePrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [modelUsed, setModelUsed] = useState<string>('');

  // Vérification initiale
  useEffect(() => {
    const checkKey = async () => {
      // Si une clé est déjà dans l'environnement (auto-injectée), on peut passer
      if (window.aistudio && window.aistudio.hasSelectedApiKey) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (hasKey) {
          setState({ step: 'idle' });
        } else {
          setState({ step: 'landing' });
        }
      } else {
        setState({ step: 'landing' });
      }
    };
    checkKey();
  }, []);

  // Callback appelé quand l'utilisateur a sélectionné sa clé
  const handleKeySelected = (manualKey?: string) => {
    if (manualKey) {
      setApiKey(manualKey);
    }
    setState({ step: 'idle' });
  };
  
  const handleAnalyze = useCallback(async () => {
    // On passe la clé manuelle si elle existe, sinon le service utilisera process.env
    const service = new GeminiService(apiKey);
    
    setState({ step: 'analyzing' });
    try {
      const result = await service.analyzeNewsletter(newsletterText);
      setAnalysis(result);
      setScenePrompt(result.visualPrompt);
      setState({ step: 'review' });
    } catch (e: any) {
      console.error(e);
      setState({ step: 'error', error: e.message || "Erreur d'analyse inconnue" });
    }
  }, [newsletterText, apiKey]);

  const handleGenerateImage = useCallback(async () => {
    const service = new GeminiService(apiKey);

    setState({ step: 'generating' });
    try {
      const result = await service.generateIllustration(scenePrompt);
      setGeneratedImageUrl(result.imageUrl);
      setModelUsed(result.modelUsed);
      setState({ step: 'complete' });
    } catch (e: any) {
      console.error(e);
      setState({ step: 'error', error: e.message || "Erreur de génération d'image" });
    }
  }, [scenePrompt, apiKey]);

  const handleReset = () => {
    setState({ step: 'idle' });
    setNewsletterText('');
    setAnalysis(null);
    setScenePrompt('');
    setGeneratedImageUrl('');
  };

  // Helper pour générer un nom de fichier propre
  const getDownloadFilename = () => {
    if (!newsletterText) return "SaaSpaladin-header.png";
    
    // Prend la première ligne non vide
    const firstLine = newsletterText.split('\n').find(line => line.trim().length > 0) || "newsletter";
    
    // Nettoie: garde alphanumérique, remplace espaces par tirets, lowercase
    const slug = firstLine
      .substring(0, 50) // Limite la longueur
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlève accents
      .replace(/[^a-zA-Z0-9 ]/g, "") // Enlève caractères spéciaux
      .trim()
      .replace(/\s+/g, "-") // Espaces -> tirets
      .toLowerCase();

    return `SaaSpaladin-header-${slug || "gen"}.png`;
  };

  const renderContent = () => {
    if (state.step === 'error') {
      return (
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded text-red-800">
          <h3 className="font-bold text-xl mb-2">Échec de la Quête</h3>
          <p className="mb-4">{state.error}</p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => setState({ step: 'landing' })}
              className="px-4 py-2 border border-red-300 hover:bg-red-100 rounded"
            >
              Changer de Clé API
            </button>
            <button 
              onClick={() => setState({ step: 'idle' })}
              className="px-4 py-2 bg-red-200 hover:bg-red-300 rounded font-bold"
            >
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    switch (state.step) {
      case 'landing':
        return <Landing onConnected={handleKeySelected} />;
      case 'idle':
      case 'analyzing':
        return (
          <StepInput
            newsletterText={newsletterText}
            setNewsletterText={setNewsletterText}
            onNext={handleAnalyze}
            isLoading={state.step === 'analyzing'}
          />
        );
      case 'review':
      case 'generating':
        return analysis ? (
          <StepReview
            analysis={analysis}
            scenePrompt={scenePrompt}
            setScenePrompt={setScenePrompt}
            onGenerate={handleGenerateImage}
            onBack={() => setState({ step: 'idle' })}
            isLoading={state.step === 'generating'}
          />
        ) : null;
      case 'complete':
        return (
          <StepResult
            imageUrl={generatedImageUrl}
            scenePrompt={scenePrompt}
            modelUsed={modelUsed}
            downloadFilename={getDownloadFilename()}
            onReset={handleReset}
            onEdit={() => setState({ step: 'review' })}
            onRegenerate={handleGenerateImage}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      {renderContent()}
    </Layout>
  );
};

export default App;
