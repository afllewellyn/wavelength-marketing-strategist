export type Platform = 'meta' | 'tiktok' | 'youtube' | 'reddit' | 'linkedin' | 'google';

export interface AnalysisInput {
  websiteUrl: string;
  productDescription: string;
  platform: Platform;
  brandVoice?: string;
  /** Optional user-uploaded LinkedIn job-title list (parsed client-side from .xlsx/.csv). */
  linkedinJobTitles?: string[];
}

export interface WebsiteAnalysis {
  valueProposition: string;
  problemSolved: string;
  targetCustomerType: string;
  industry: string;
  pricingSignals: string;
  buyerAwarenessLevel: 'unaware' | 'problem-aware' | 'solution-aware' | 'product-aware' | 'most-aware';
  confidence: 'high' | 'medium' | 'low';
  assumptions: string[];
}

export interface ICP {
  name: string;
  type: 'primary' | 'secondary' | 'avoid';
  demographics: {
    ageRange: string;
    gender: string;
    location: string;
    income: string;
    education: string;
  };
  psychographics: {
    values: string[];
    interests: string[];
    lifestyle: string;
  };
  jobTitles: string[];
  behavioralTraits: string[];
  painPoints: string[];
  emotionalDrivers: string[];
  reasoning: string;
}

export interface AdVariation {
  headline: string;
  hook: string;
  primaryText: string;
  cta: string;
  testingVariable: string;
}

export interface AdCopy {
  audienceSegment: string;
  platformFormat: string;
  ads: AdVariation[];
  successSignals: string[];
}

export interface AudienceType {
  type: string;
  description: string;
  priority: 'primary' | 'test';
}

export interface LinkedInTargeting {
  jobTitles: string[];
  skills: string[];
  companies: string[];
  industries: string[];
  groups: string[];
}

export interface TargetingStrategy {
  platform: Platform;
  audienceTypes: AudienceType[];
  interests: string[];
  behaviors: string[];
  keywords?: string[];              // Google, YouTube, Reddit only
  communities?: string[];           // Reddit only
  linkedinTargeting?: LinkedInTargeting;  // LinkedIn only
  placements: string[];
  exclusions: string[];
  funnelStage: 'cold' | 'warm' | 'retargeting';
  funnelReasoning: string;
  platformNotes: string;
  // --- Enrichment layers (populated client-side after the base analysis) ---
  metaReachEstimate?: MetaReachEstimate;        // Meta only
  communityMetrics?: RedditCommunityMetric[];   // Reddit only
  tiktokInterestMatches?: TiktokInterestMatch[]; // TikTok only
}

// --- Real-data enrichment types ---

/** DataForSEO Google Ads keyword demand for a Google Search target keyword. */
export interface KeywordMetric {
  keyword: string;
  volume: number | null;       // avg monthly searches
  cpc: number | null;          // estimated CPC (USD)
  competition: number | null;  // 0-1 competition index
  difficulty: number | null;   // 0-100 keyword difficulty band
}

/** A Meta ad-interest resolved (or not) against Meta's targeting library. */
export interface MetaResolvedInterest {
  name: string;
  id: string | null;
  matched: boolean;
  audienceSize?: number | null;
}

/** Meta reach estimate for the targeting strategy's interests. */
export interface MetaReachEstimate {
  resolvedInterests: MetaResolvedInterest[];
  audienceSize: { lower: number; upper: number };
  suggestion: 'too-narrow' | 'healthy' | 'too-broad';
}

/** Real subscriber count for a suggested subreddit. */
export interface RedditCommunityMetric {
  name: string;               // without the "r/" prefix
  subscribers: number | null;
  matched: boolean;
}

/** A TikTok interest validated against TikTok's interest-category taxonomy. */
export interface TiktokInterestMatch {
  name: string;
  categoryId: string | null;
  matched: boolean;
}

/** Per-layer status so the UI can show quiet badges without blocking the report. */
export type EnrichStatus = 'ok' | 'empty' | 'error';

// Google Search Ad specific types
export interface SearchAdHeadline {
  text: string;        // Max 30 characters
  charCount: number;
  searchTermIncluded?: string;
}

export interface SearchAdDescription {
  text: string;        // Max 90 characters
  charCount: number;
  searchTermIncluded?: string;
}

export interface SearchAdGroup {
  audienceSegment: string;
  headlines: SearchAdHeadline[];
  descriptions: SearchAdDescription[];
  targetKeywords: string[];
  displayPath: string[];
  testingNotes: string;
}

export interface AnalysisResult {
  websiteAnalysis: WebsiteAnalysis;
  icps: ICP[];
  targetingStrategy: TargetingStrategy;
  adCopy: AdCopy[];
  searchAdCopy?: SearchAdGroup[];  // For Google only
  scrapedContent?: string;
  /** DataForSEO keyword demand keyed by target keyword (Google only). */
  keywordMetrics?: KeywordMetric[];
  /** Status of each enrichment layer for graceful, non-blocking UI badges. */
  enrichmentStatus?: {
    keywords?: EnrichStatus;
    meta?: EnrichStatus;
    reddit?: EnrichStatus;
    tiktok?: EnrichStatus;
  };
}

export interface AnalysisState {
  isLoading: boolean;
  currentStep: 'idle' | 'scraping' | 'analyzing' | 'generating' | 'complete' | 'error';
  error?: string;
  result?: AnalysisResult;
}
