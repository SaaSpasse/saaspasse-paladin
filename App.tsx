
import React, { useState, useCallback, useEffect } from 'react';
import { Layout } from './components/Layout';
import { StepInput } from './components/StepInput';
import { StepReview } from './components/StepReview';
import { StepResult } from './components/StepResult';
import { GeminiService, hasSecret, setSecret, clearSecret } from './services/geminiService';
import { AnalysisResult, GenerationState } from './types';

const PasswordScreen: React.FC<{ onSubmit: (password: string) => void; error?: string }> = ({ onSubmit, error }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password.trim());
    }
  };

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8 py-12">
      <div className="max-w-md mx-auto space-y-6">
        <div className="mx-auto">
          <img
            src="/paladin-hero.png"
            alt="SaaSpaladin"
            className="w-32 h-32 object-contain drop-shadow-lg"
          />
        </div>

        <h2 className="text-2xl font-fantasy text-paladin-dark">Halte, voyageur!</h2>
        <p className="text-gray-600">Entrez le mot de passe pour accéder à la forge.</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            className="w-full p-3 border-2 border-paladin-dark rounded focus:border-paladin-purple outline-none text-center font-mono text-lg"
            autoFocus
          />
          <button
            type="submit"
            className="w-full bg-paladin-purple text-paladin-cream px-8 py-4 font-fantasy text-xl shadow-[6px_6px_0px_0px_rgba(7,10,38,1)] hover:translate-y-1 hover:shadow-none transition-all border-2 border-paladin-dark"
          >
            Entrer dans la forge
          </button>
        </form>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(hasSecret());
  const [authError, setAuthError] = useState<string | undefined>();
  const [state, setState] = useState<GenerationState>({ step: 'idle' });

  // Data State
  const [newsletterText, setNewsletterText] = useState('');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [scenePrompt, setScenePrompt] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [modelUsed, setModelUsed] = useState<string>('');

  const handlePasswordSubmit = (password: string) => {
    setSecret(password);
    setIsAuthenticated(true);
    setAuthError(undefined);
  };

  const handleAuthError = () => {
    clearSecret();
    setIsAuthenticated(false);
    setAuthError("Mot de passe invalide");
  };

  const handleAnalyze = useCallback(async () => {
    const service = new GeminiService();

    setState({ step: 'analyzing' });
    try {
      const result = await service.analyzeNewsletter(newsletterText);
      setAnalysis(result);
      setScenePrompt(result.visualPrompt);
      setState({ step: 'review' });
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('invalide')) {
        handleAuthError();
      } else {
        setState({ step: 'error', error: e.message || "Erreur d'analyse inconnue" });
      }
    }
  }, [newsletterText]);

  const handleGenerateImage = useCallback(async () => {
    const service = new GeminiService();

    setState({ step: 'generating' });
    try {
      const result = await service.generateIllustration(scenePrompt);
      setGeneratedImageUrl(result.imageUrl);
      setModelUsed(result.modelUsed);
      setState({ step: 'complete' });
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('invalide')) {
        handleAuthError();
      } else {
        setState({ step: 'error', error: e.message || "Erreur de génération d'image" });
      }
    }
  }, [scenePrompt]);

  const handleReset = () => {
    setState({ step: 'idle' });
    setNewsletterText('');
    setAnalysis(null);
    setScenePrompt('');
    setGeneratedImageUrl('');
  };

  const getDownloadFilename = () => {
    if (!newsletterText) return "SaaSpaladin-header.png";

    const firstLine = newsletterText.split('\n').find(line => line.trim().length > 0) || "newsletter";

    const slug = firstLine
      .substring(0, 50)
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();

    return `SaaSpaladin-header-${slug || "gen"}.png`;
  };

  const renderContent = () => {
    if (!isAuthenticated) {
      return <PasswordScreen onSubmit={handlePasswordSubmit} error={authError} />;
    }

    if (state.step === 'error') {
      return (
        <div className="text-center p-8 bg-red-50 border border-red-200 rounded text-red-800">
          <h3 className="font-bold text-xl mb-2">Échec de la Quête</h3>
          <p className="mb-4">{state.error}</p>
          <button
            onClick={() => setState({ step: 'idle' })}
            className="px-4 py-2 bg-red-200 hover:bg-red-300 rounded font-bold"
          >
            Réessayer
          </button>
        </div>
      );
    }

    switch (state.step) {
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
