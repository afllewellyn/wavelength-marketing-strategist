const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const META_API_VERSION = 'v21.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

interface EstimateInput {
  interests?: string[];
  behaviors?: string[];
  geoCountries?: string[];
}

interface MetaSearchItem {
  id: string;
  name: string;
  audience_size_lower_bound?: number;
  audience_size_upper_bound?: number;
}

interface ResolvedSelection {
  id?: string;
  name: string;
  type: 'interest' | 'behavior';
  audienceSize: { lower: number; upper: number };
  matched: boolean;
}

async function metaSearch(
  params: Record<string, string>,
  accessToken: string
): Promise<MetaSearchItem[]> {
  const url = new URL(`${META_BASE_URL}/search`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
  url.searchParams.set('limit', '5');
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    console.error('Meta search error:', data);
    throw new Error(data?.error?.message || 'Meta search request failed');
  }

  return data.data || [];
}

function pickBestMatch(query: string, results: MetaSearchItem[]): MetaSearchItem | null {
  if (!results.length) return null;
  const normalized = query.toLowerCase().trim();
  const exact = results.find((r) => r.name.toLowerCase() === normalized);
  if (exact) return exact;

  // Only accept a fuzzy hit when it shares a meaningful word with the query.
  // Meta's search returns loosely related interests (e.g. "Entertainment News"
  // for a B2B SaaS term); blindly taking results[0] surfaces irrelevant targets.
  const stopWords = new Set(['for', 'and', 'the', 'a', 'an', 'of', 'in', 'on', 'to', 'with']);
  const tokens = normalized.split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !stopWords.has(t));
  return (
    results.find((r) => {
      const name = r.name.toLowerCase();
      return tokens.some((t) => name.includes(t));
    }) || null
  );
}

async function resolveInterest(name: string, accessToken: string): Promise<MetaSearchItem | null> {
  const results = await metaSearch({ type: 'adinterest', q: name }, accessToken);
  return pickBestMatch(name, results);
}

async function resolveBehavior(name: string, accessToken: string): Promise<MetaSearchItem | null> {
  const results = await metaSearch(
    { type: 'adTargetingCategory', class: 'behaviors', q: name },
    accessToken
  );
  return pickBestMatch(name, results);
}

async function suggestAlternatives(
  term: string,
  category: 'interest' | 'behavior',
  apiKey: string
): Promise<string[]> {
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          {
            role: 'system',
            content: `You suggest real Meta (Facebook/Instagram) Ads Manager ${category} targeting names that are close in meaning to a given term. Respond ONLY with a JSON array of 2-3 short strings — no explanation, no markdown.`,
          },
          {
            role: 'user',
            content: `Suggest ${category} targeting alternatives available in Meta Ads Manager for: "${term}"`,
          },
        ],
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return [];

    const match = content.match(/\[[\s\S]*\]/);
    const parsed = JSON.parse(match ? match[0] : content);
    return Array.isArray(parsed) ? parsed.filter((s: unknown) => typeof s === 'string') : [];
  } catch (error) {
    console.error('Lovable AI fallback failed:', error);
    return [];
  }
}

async function resolveWithFallback(
  name: string,
  type: 'interest' | 'behavior',
  accessToken: string,
  lovableApiKey: string | undefined
): Promise<ResolvedSelection> {
  const resolver = type === 'interest' ? resolveInterest : resolveBehavior;

  let match = await resolver(name, accessToken).catch((error) => {
    console.error(`Failed to resolve ${type} "${name}":`, error);
    return null;
  });

  if (!match && lovableApiKey) {
    const alternatives = await suggestAlternatives(name, type, lovableApiKey);
    for (const alt of alternatives) {
      match = await resolver(alt, accessToken).catch(() => null);
      if (match) break;
    }
  }

  if (match) {
    return {
      id: match.id,
      name: match.name,
      type,
      audienceSize: {
        lower: match.audience_size_lower_bound ?? 0,
        upper: match.audience_size_upper_bound ?? 0,
      },
      matched: true,
    };
  }

  return { name, type, audienceSize: { lower: 0, upper: 0 }, matched: false };
}

async function getReachEstimate(
  interestIds: string[],
  behaviorIds: string[],
  adAccountId: string,
  accessToken: string,
  countries: string[]
): Promise<{ lower: number; upper: number } | null> {
  if (interestIds.length === 0 && behaviorIds.length === 0) return null;

  // Interests and behaviors go in a SINGLE flexible_spec entry so Meta treats them as
  // one OR'd group — matching what a marketer gets by adding these to one Detailed
  // Targeting box in Ads Manager. Separate flexible_spec entries are AND'd by Meta,
  // which would instead compute the (much smaller) intersection audience.
  const singleGroup: Record<string, unknown> = {};
  if (interestIds.length) singleGroup.interests = interestIds.map((id) => ({ id }));
  if (behaviorIds.length) singleGroup.behaviors = behaviorIds.map((id) => ({ id }));

  const targetingSpec: Record<string, unknown> = {
    geo_locations: { countries },
    flexible_spec: [singleGroup],
  };

  const accountPath = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;
  const url = new URL(`${META_BASE_URL}/${accountPath}/reachestimate`);
  url.searchParams.set('targeting_spec', JSON.stringify(targetingSpec));
  url.searchParams.set('access_token', accessToken);

  const response = await fetch(url.toString());
  const data = await response.json();

  if (!response.ok) {
    console.error('Meta reachestimate error:', data);
    return null;
  }

  const estimate = data?.data;
  if (!estimate) return null;

  return {
    lower: estimate.users_lower_bound ?? estimate.estimate_mau ?? 0,
    upper: estimate.users_upper_bound ?? estimate.estimate_mau ?? 0,
  };
}

function bandSuggestion(
  size: { lower: number; upper: number } | null
): 'too-narrow' | 'healthy' | 'too-broad' | null {
  if (!size) return null;
  if (size.upper < 1_000) return 'too-narrow';
  if (size.lower > 10_000_000) return 'too-broad';
  return 'healthy';
}

// This function has verify_jwt = false (called anonymously from the browser), so inputs
// are bounded to cap worst-case fan-out: each term can trigger a Meta search plus, on a
// miss, a Lovable AI call and up to 3 more Meta searches for alternatives.
const MAX_TERMS_PER_FIELD = 12;
const MAX_TERM_LENGTH = 100;
const MAX_COUNTRIES = 10;
const MAX_COUNTRY_CODE_LENGTH = 5;

function sanitizeStringArray(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .slice(0, maxItems)
    .map((s) => s.trim().slice(0, maxLength));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: EstimateInput = await req.json();
    const interests = sanitizeStringArray(input.interests, MAX_TERMS_PER_FIELD, MAX_TERM_LENGTH);
    const behaviors = sanitizeStringArray(input.behaviors, MAX_TERMS_PER_FIELD, MAX_TERM_LENGTH);
    const geoCountries = sanitizeStringArray(input.geoCountries, MAX_COUNTRIES, MAX_COUNTRY_CODE_LENGTH);
    const countries = geoCountries.length ? geoCountries : ['US'];

    if (interests.length === 0 && behaviors.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'At least one interest or behavior is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = Deno.env.get('META_ACCESS_TOKEN');
    const adAccountId = Deno.env.get('META_AD_ACCOUNT_ID');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!accessToken || !adAccountId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Meta credentials are not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Resolving Meta audience selections:', { interests, behaviors });

    const [interestSelections, behaviorSelections] = await Promise.all([
      Promise.all(interests.map((name) => resolveWithFallback(name, 'interest', accessToken, lovableApiKey))),
      Promise.all(behaviors.map((name) => resolveWithFallback(name, 'behavior', accessToken, lovableApiKey))),
    ]);

    const matchedInterestIds = interestSelections
      .filter((s) => s.matched && s.id)
      .map((s) => s.id as string);
    const matchedBehaviorIds = behaviorSelections
      .filter((s) => s.matched && s.id)
      .map((s) => s.id as string);

    const totalAudienceSize = await getReachEstimate(
      matchedInterestIds,
      matchedBehaviorIds,
      adAccountId,
      accessToken,
      countries
    ).catch((error) => {
      console.error('Combined reach estimate failed:', error);
      return null;
    });

    const suggestion = bandSuggestion(totalAudienceSize);

    const selections = [...interestSelections, ...behaviorSelections].map(({ id, ...rest }) => rest);

    console.log('Meta audience resolution complete:', {
      matched: selections.filter((s) => s.matched).length,
      unmatched: selections.filter((s) => !s.matched).length,
    });

    return new Response(
      JSON.stringify({
        success: true,
        result: { selections, totalAudienceSize, suggestion },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Meta reach estimate error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Meta audience validation failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
