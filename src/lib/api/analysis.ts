import { supabase } from '@/integrations/supabase/client';
import type {
  AnalysisInput,
  AnalysisResult,
  MetaAudienceSelection,
  MetaAudienceSuggestion,
  KeywordMetric,
  GoogleAdsAudienceSelection,
} from '@/types/analysis';

interface MetaReachResult {
  selections: MetaAudienceSelection[];
  totalAudienceSize: { lower: number; upper: number } | null;
  suggestion: MetaAudienceSuggestion | null;
}

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

  const result: AnalysisResult = data.result;

  if (input.platform === 'meta') {
    try {
      const metaReach = await estimateMetaReach(
        result.targetingStrategy.interests,
        result.targetingStrategy.behaviors
      );
      result.targetingStrategy.metaAudience = metaReach.selections;
      if (metaReach.totalAudienceSize) {
        result.targetingStrategy.metaAudienceSize = metaReach.totalAudienceSize;
      }
      if (metaReach.suggestion) {
        result.targetingStrategy.metaAudienceSuggestion = metaReach.suggestion;
      }
    } catch (metaError) {
      console.error('Meta audience validation failed:', metaError);
      result.targetingStrategy.metaAudienceError =
        metaError instanceof Error ? metaError.message : 'Meta audience validation unavailable';
    }
  }

  if (input.platform === 'google' && result.targetingStrategy.keywords?.length) {
    try {
      result.targetingStrategy.keywordMetrics = await enrichKeywords(result.targetingStrategy.keywords);
    } catch (keywordError) {
      console.error('Keyword enrichment failed:', keywordError);
      result.targetingStrategy.keywordMetricsError =
        keywordError instanceof Error ? keywordError.message : 'Keyword demand data unavailable';
    }
  }

  if (input.platform === 'youtube') {
    try {
      result.targetingStrategy.youtubeAudience = await estimateYoutubeAudience(
        result.targetingStrategy.interests,
        result.targetingStrategy.behaviors
      );
    } catch (youtubeError) {
      console.error('YouTube audience validation failed:', youtubeError);
      result.targetingStrategy.youtubeAudienceError =
        youtubeError instanceof Error ? youtubeError.message : 'YouTube audience validation unavailable';
    }
  }

  return result;
}

async function estimateMetaReach(interests: string[], behaviors: string[]): Promise<MetaReachResult> {
  const { data, error } = await supabase.functions.invoke('estimate-meta-reach', {
    body: { interests, behaviors },
  });

  if (error) {
    throw new Error(error.message || 'Failed to validate Meta audience');
  }

  if (!data.success) {
    throw new Error(data.error || 'Meta audience validation failed');
  }

  return data.result;
}

async function enrichKeywords(keywords: string[]): Promise<KeywordMetric[]> {
  const { data, error } = await supabase.functions.invoke('enrich-keywords', {
    body: { keywords },
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch keyword demand data');
  }

  if (!data.success) {
    throw new Error(data.error || 'Keyword enrichment failed');
  }

  return data.metrics;
}

async function estimateYoutubeAudience(
  interests: string[],
  behaviors: string[]
): Promise<GoogleAdsAudienceSelection[]> {
  const { data, error } = await supabase.functions.invoke('estimate-youtube-audience', {
    body: { interests, behaviors },
  });

  if (error) {
    throw new Error(error.message || 'Failed to validate YouTube audience');
  }

  if (!data.success) {
    throw new Error(data.error || 'YouTube audience validation failed');
  }

  return data.selections;
}
