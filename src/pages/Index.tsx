import { useState, useCallback } from 'react';
import { Header } from '@/components/wavelength/Header';
import { AnalysisForm } from '@/components/wavelength/AnalysisForm';
import { ResultsSection } from '@/components/wavelength/ResultsSection';
import { ErrorDisplay } from '@/components/wavelength/ErrorDisplay';
import { analyzeWebsite } from '@/lib/api/analysis';
import type { AnalysisInput, AnalysisState } from '@/types/analysis';

const Index = () => {
  const [state, setState] = useState<AnalysisState>({
    isLoading: false,
    currentStep: 'idle',
  });
  const [lastInput, setLastInput] = useState<AnalysisInput | null>(null);

  const handleSubmit = useCallback(async (input: AnalysisInput) => {
    setLastInput(input);
    setState({ isLoading: true, currentStep: 'scraping' });

    try {
      // Simulate step transitions for UX
      setTimeout(() => {
        setState((prev) => ({ ...prev, currentStep: 'analyzing' }));
      }, 2000);

      setTimeout(() => {
        setState((prev) => ({ ...prev, currentStep: 'generating' }));
      }, 5000);

      const result = await analyzeWebsite(input);

      setState({
        isLoading: false,
        currentStep: 'complete',
        result,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
      setState({
        isLoading: false,
        currentStep: 'error',
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  }, []);

  const handleRetry = useCallback(() => {
    if (lastInput) {
      handleSubmit(lastInput);
    }
  }, [lastInput, handleSubmit]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <Header />

        <main className="space-y-8">
          <AnalysisForm
            onSubmit={handleSubmit}
            isLoading={state.isLoading}
            currentStep={state.currentStep}
          />

          {state.currentStep === 'error' && state.error && (
            <ErrorDisplay message={state.error} onRetry={handleRetry} />
          )}

          {state.currentStep === 'complete' && state.result && (
            <ResultsSection result={state.result} />
          )}
        </main>
      </div>
    </div>
  );
};

export default Index;
