const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisInput {
  websiteUrl: string;
  productDescription: string;
  platform: string;
  brandVoice?: string;
}

const SYSTEM_PROMPT = `You are a world-class performance marketing strategist with 15+ years of experience running paid acquisition for high-growth startups and Fortune 500 companies. You think like a CMO but execute like a media buyer.

Your task is to analyze a website and product, then provide strategic marketing insights. Be opinionated, specific, and actionable. Avoid generic advice. Every recommendation should be immediately implementable.

When you're uncertain about something, explicitly state your confidence level and the assumptions you're making.

Respond ONLY with valid JSON matching this exact structure:
{
  "websiteAnalysis": {
    "valueProposition": "string - The core value proposition in one clear sentence",
    "problemSolved": "string - The specific problem this product solves",
    "targetCustomerType": "string - Who this product is primarily for",
    "industry": "string - The industry/vertical",
    "pricingSignals": "string - What pricing tier or model is indicated",
    "buyerAwarenessLevel": "unaware" | "problem-aware" | "solution-aware" | "product-aware" | "most-aware",
    "confidence": "high" | "medium" | "low",
    "assumptions": ["array of strings - explicit assumptions made during analysis"]
  },
  "icps": [
    {
      "name": "string - Descriptive name for this segment",
      "type": "primary" | "secondary" | "avoid",
      "demographics": {
        "ageRange": "string",
        "gender": "string",
        "location": "string",
        "income": "string",
        "education": "string"
      },
      "psychographics": {
        "values": ["array of 2-3 core values"],
        "interests": ["array of 3-5 interests"],
        "lifestyle": "string description"
      },
      "jobTitles": ["array of 3-5 relevant job titles"],
      "behavioralTraits": ["array of 3-4 behavioral patterns"],
      "painPoints": ["array of 3-5 specific pain points"],
      "emotionalDrivers": ["array of 2-4 emotional motivators"],
      "reasoning": "string - Why this ICP is classified as primary/secondary/avoid"
    }
  ],
  "targetingStrategy": {
    "platform": "string - the platform being targeted (meta, tiktok, youtube, reddit, linkedin, google)",
    "audienceTypes": [
      {
        "type": "string - e.g., 'Lookalike 1%', 'Interest Stack', 'Broad with exclusions'",
        "description": "string - detailed description of how to set this up",
        "priority": "primary" | "test"
      }
    ],
    "interests": ["array of 5-10 specific platform interests to target"],
    "behaviors": ["array of 3-6 behavioral targeting options available on this platform"],
    "keywords": ["array of 5-10 keywords - only for Google/Reddit, otherwise empty array"],
    "communities": ["array of subreddits/groups - only for Reddit/LinkedIn, otherwise empty array"],
    "placements": ["array of 3-5 specific ad placements for this platform"],
    "exclusions": ["array of 3-5 audiences/behaviors to exclude"],
    "funnelStage": "cold" | "warm" | "retargeting",
    "funnelReasoning": "string - explain why this funnel stage is recommended based on the product/market",
    "platformNotes": "string - 2-3 sentences of platform-specific tactical advice",
    "budgetRecommendation": {
      "dailyMin": "string - minimum daily budget recommendation, e.g., '$50'",
      "testDuration": "string - recommended test period, e.g., '7-14 days'"
    }
  },
  "adCopy": [
    {
      "audienceSegment": "string - Which ICP this targets",
      "platformFormat": "string - e.g., 'Meta Feed Ad' or 'TikTok In-Feed Video'",
      "ads": [
        {
          "headline": "string - Attention-grabbing headline",
          "hook": "string - Opening hook (first 1-2 sentences)",
          "primaryText": "string - Main ad body (2-4 sentences)",
          "cta": "string - Call to action",
          "testingVariable": "string - What this variation tests"
        }
      ],
      "successSignals": ["array of 3-4 metrics to watch, e.g., 'CTR > 2%', 'CPC < $1.50'"]
    }
  ]
}

Platform-specific targeting guidance:
- Meta: Focus on Lookalike audiences, interest stacking, Advantage+ options, Feed/Stories/Reels placements
- TikTok: Emphasize interest categories, creator-like content, For You page optimization
- YouTube: Consider in-stream vs discovery, topic targeting, custom intent audiences
- Reddit: Focus on subreddit targeting, interest communities, conversation targeting
- LinkedIn: Prioritize job titles, company size, industry, member skills
- Google: Include keyword themes, custom intent, Performance Max considerations

Provide 1 primary ICP, 1 secondary ICP, and 1 ICP to avoid. For ad copy, provide 2 ads per ICP segment (primary only), with 2-3 test variations. Make the ads platform-native and respect any brand voice guidelines provided.`;

async function scrapeWebsite(url: string): Promise<string> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    throw new Error('Firecrawl API key not configured');
  }

  console.log('Scraping URL:', url);

  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Firecrawl error:', data);
    throw new Error(data.error || `Failed to scrape website: ${response.status}`);
  }

  const markdown = data.data?.markdown || data.markdown || '';
  console.log('Scraped content length:', markdown.length);

  // Truncate if too long (keep first 15000 chars for context window)
  return markdown.slice(0, 15000);
}

async function analyzeWithAI(
  websiteContent: string,
  input: AnalysisInput
): Promise<any> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  if (!apiKey) {
    throw new Error('Lovable API key not configured');
  }

  const userPrompt = `Analyze this website and create a comprehensive marketing strategy.

WEBSITE URL: ${input.websiteUrl}

PRODUCT DESCRIPTION (from the user):
${input.productDescription}

PRIMARY ADVERTISING PLATFORM: ${input.platform}

${input.brandVoice ? `BRAND VOICE GUIDELINES:\n${input.brandVoice}` : 'No specific brand voice guidelines provided.'}

SCRAPED WEBSITE CONTENT:
---
${websiteContent}
---

Based on all of the above, provide your strategic analysis as JSON.`;

  console.log('Calling AI for analysis...');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-3-flash-preview',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    if (response.status === 402) {
      throw new Error('AI usage limit reached. Please add credits to continue.');
    }
    const errorText = await response.text();
    console.error('AI API error:', response.status, errorText);
    throw new Error('AI analysis failed. Please try again.');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No response from AI');
  }

  console.log('AI response received, parsing JSON...');

  // Extract JSON from the response (handle markdown code blocks)
  let jsonStr = content;
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1];
  }

  try {
    return JSON.parse(jsonStr.trim());
  } catch (e) {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to parse AI response. Please try again.');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: AnalysisInput = await req.json();

    // Validate input
    if (!input.websiteUrl || !input.productDescription || !input.platform) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Starting analysis for:', input.websiteUrl);

    // Step 1: Scrape website
    const websiteContent = await scrapeWebsite(input.websiteUrl);

    if (!websiteContent || websiteContent.length < 50) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Could not extract enough content from the website. Please check the URL and try again.' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Analyze with AI
    const result = await analyzeWithAI(websiteContent, input);

    console.log('Analysis complete');

    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
