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

    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => {
        setState((prev) => (prev.isLoading ? { ...prev, currentStep: 'analyzing' } : prev));
      }, 2000)
    );
    timers.push(
      setTimeout(() => {
        setState((prev) => (prev.isLoading ? { ...prev, currentStep: 'generating' } : prev));
      }, 5000)
    );

    try {
      const result = await analyzeWebsite(input);
      timers.forEach(clearTimeout);
      setState({
        isLoading: false,
        currentStep: 'complete',
        result,
      });
    } catch (error) {
      timers.forEach(clearTimeout);
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
