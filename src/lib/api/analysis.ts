import { supabase } from '@/integrations/supabase/client';
import type {
  AnalysisInput,
  AnalysisResult,
  EnrichStatus,
  KeywordMetric,
  MetaReachEstimate,
  RedditCommunityMetric,
  TiktokInterestMatch,
} from '@/types/analysis';

/** Runs the base analysis, then layers in real platform data (DataForSEO, Meta,
 *  Reddit, TikTok). Enrichment runs in parallel and fails soft — a failure in any
 *  layer never blocks the core report, it just records a status the UI can show. */
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
  return enrichResult(result);
}

async function enrichResult(result: AnalysisResult): Promise<AnalysisResult> {
  const platform = result.targetingStrategy?.platform;
  result.enrichmentStatus = result.enrichmentStatus ?? {};

  if (platform === 'google') {
    await enrichKeywords(result);
  } else if (platform === 'meta') {
    await enrichMeta(result);
  } else if (platform === 'reddit') {
    await enrichReddit(result);
  } else if (platform === 'tiktok') {
    await enrichTiktok(result);
  }

  return result;
}

/** Invoke an enrichment edge function, returning its parsed payload or throwing. */
async function invokeEnrichment<T>(fn: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) throw new Error(error.message || `${fn} failed`);
  if (!data?.success) throw new Error(data?.error || `${fn} failed`);
  return data as T;
}

// Hard cap on keywords sent to DataForSEO per run, to bound cost on live credentials.
const MAX_KEYWORDS_PER_RUN = 20;

async function enrichKeywords(result: AnalysisResult): Promise<void> {
  // De-duped union of target keywords across every Google ad group, capped for cost.
  const keywords = [
    ...new Set((result.searchAdCopy ?? []).flatMap((g) => g.targetKeywords ?? [])),
  ].slice(0, MAX_KEYWORDS_PER_RUN);
  if (keywords.length === 0) {
    result.enrichmentStatus!.keywords = 'empty';
    return;
  }
  try {
    const { metrics } = await invokeEnrichment<{ metrics: KeywordMetric[] }>('enrich-keywords', { keywords });
    result.keywordMetrics = metrics;
    result.enrichmentStatus!.keywords = metrics.length > 0 ? 'ok' : 'empty';
  } catch (e) {
    console.error('Keyword enrichment failed:', e);
    result.enrichmentStatus!.keywords = 'error';
  }
}

async function enrichMeta(result: AnalysisResult): Promise<void> {
  const interests = result.targetingStrategy?.interests ?? [];
  if (interests.length === 0) {
    result.enrichmentStatus!.meta = 'empty';
    return;
  }
  try {
    const { estimate } = await invokeEnrichment<{ estimate: MetaReachEstimate }>('estimate-meta-reach', {
      interests,
      behaviors: result.targetingStrategy?.behaviors ?? [],
    });
    result.targetingStrategy.metaReachEstimate = estimate;
    result.enrichmentStatus!.meta = 'ok';
  } catch (e) {
    console.error('Meta reach enrichment failed:', e);
    result.enrichmentStatus!.meta = 'error';
  }
}

async function enrichReddit(result: AnalysisResult): Promise<void> {
  const communities = result.targetingStrategy?.communities ?? [];
  if (communities.length === 0) {
    result.enrichmentStatus!.reddit = 'empty';
    return;
  }
  try {
    const { metrics } = await invokeEnrichment<{ metrics: RedditCommunityMetric[] }>('enrich-reddit', {
      communities,
    });
    result.targetingStrategy.communityMetrics = metrics;
    result.enrichmentStatus!.reddit = metrics.length > 0 ? 'ok' : 'empty';
  } catch (e) {
    console.error('Reddit enrichment failed:', e);
    result.enrichmentStatus!.reddit = 'error';
  }
}

async function enrichTiktok(result: AnalysisResult): Promise<void> {
  const interests = result.targetingStrategy?.interests ?? [];
  if (interests.length === 0) {
    result.enrichmentStatus!.tiktok = 'empty';
    return;
  }
  try {
    const { matches } = await invokeEnrichment<{ matches: TiktokInterestMatch[] }>('enrich-tiktok-audience', {
      interests,
    });
    result.targetingStrategy.tiktokInterestMatches = matches;
    result.enrichmentStatus!.tiktok = matches.length > 0 ? 'ok' : 'empty';
  } catch (e) {
    console.error('TikTok enrichment failed:', e);
    result.enrichmentStatus!.tiktok = 'error';
  }
}

// Re-exported for tests / potential direct use.
export type { EnrichStatus };
