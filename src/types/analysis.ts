export type Platform = 'meta' | 'tiktok' | 'youtube' | 'reddit' | 'linkedin' | 'google';

export interface AnalysisInput {
  websiteUrl: string;
  productDescription: string;
  platform: Platform;
  brandVoice?: string;
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

export interface TargetingStrategy {
  platform: Platform;
  audienceTypes: AudienceType[];
  interests: string[];
  behaviors: string[];
  keywords?: string[];
  communities?: string[];
  placements: string[];
  exclusions: string[];
  funnelStage: 'cold' | 'warm' | 'retargeting';
  funnelReasoning: string;
  platformNotes: string;
  budgetRecommendation?: {
    dailyMin: string;
    testDuration: string;
  };
}

export interface AnalysisResult {
  websiteAnalysis: WebsiteAnalysis;
  icps: ICP[];
  targetingStrategy: TargetingStrategy;
  adCopy: AdCopy[];
  scrapedContent?: string;
}

export interface AnalysisState {
  isLoading: boolean;
  currentStep: 'idle' | 'scraping' | 'analyzing' | 'generating' | 'complete' | 'error';
  error?: string;
  result?: AnalysisResult;
}
