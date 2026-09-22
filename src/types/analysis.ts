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

export interface MetaAudienceSelection {
  name: string;               // Exact name as it appears in Meta Ads Manager
  type: 'interest' | 'behavior';
  audienceSize: { lower: number; upper: number };
  matched: boolean;           // true if found in Meta's targeting library
}

export type MetaAudienceSuggestion = 'too-narrow' | 'healthy' | 'too-broad';

// Google Search only — real keyword demand from DataForSEO (Keyword Planner data)
export interface KeywordMetric {
  keyword: string;
  volume: number | null;       // avg monthly searches
  cpc: number | null;          // estimated CPC (USD)
  competition: number | null;  // 0-1 competition index
  difficulty: number | null;   // 0-100 band (competition_index proxy)
}

// YouTube only — real interests/topics resolved against Google Ads' audience catalogs
// (user_interest for affinity/in-market categories, topic_constant as a fallback)
export interface GoogleAdsAudienceSelection {
  name: string;                // Exact name as it appears in Google Ads
  type: 'interest' | 'behavior';
  matched: boolean;
  category?: string;           // e.g. AFFINITY, IN_MARKET, or 'topic'
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
  // Meta only — real audience selections resolved against Meta's Ads Manager targeting library
  metaAudience?: MetaAudienceSelection[];
  metaAudienceSize?: { lower: number; upper: number };
  metaAudienceSuggestion?: MetaAudienceSuggestion;
  metaAudienceError?: string;
  // Google (Search) only — real keyword demand via DataForSEO
  keywordMetrics?: KeywordMetric[];
  keywordMetricsError?: string;
  // YouTube only — real interests/topics via the Google Ads API
  youtubeAudience?: GoogleAdsAudienceSelection[];
  youtubeAudienceError?: string;
}

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
}

export interface AnalysisState {
  isLoading: boolean;
  currentStep: 'idle' | 'scraping' | 'analyzing' | 'generating' | 'validating' | 'complete' | 'error';
  error?: string;
  result?: AnalysisResult;
}
