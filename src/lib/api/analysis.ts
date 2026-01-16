import { supabase } from '@/integrations/supabase/client';
import type { AnalysisInput, AnalysisResult } from '@/types/analysis';

export async function analyzeWebsite(input: AnalysisInput): Promise<AnalysisResult> {
  const { data, error } = await supabase.functions.invoke('analyze-website', {
    body: input,
  });

  if (error) {
    console.error('Analysis error:', error);
    throw new Error(error.message || 'Failed to analyze website');
  }

  if (!data.success) {
    throw new Error(data.error || 'Analysis failed');
  }

  return data.result;
}
