// Validates a YouTube targeting strategy's interests/behaviors against Google Ads'
// real audience catalogs (user_interest, with topic_constant as a fallback) so a
// marketer sees the same targetable names they'd pick in Google Ads. YouTube
// campaigns are managed inside Google Ads and draw on these same catalogs — this
// reuses the operator's Google Ads Explorer-tier dev token rather than needing a
// separate YouTube-specific credential. Explorer tier gives real catalog names/IDs
// but not a reach estimate (that needs Standard/Basic access), so unlike Meta this
// only returns matched/unmatched status, not an audience size.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_ADS_API_VERSION = 'v25';

interface EstimateInput {
  interests?: string[];
  behaviors?: string[];
}

interface GoogleAdsCredentials {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string;
  loginCustomerId: string;
}

interface CatalogMatch {
  name: string;
  category: string;
}

interface ResolvedSelection {
  name: string;
  type: 'interest' | 'behavior';
  matched: boolean;
  category?: string;
}

// This function has verify_jwt = false (called anonymously from the browser), so
// inputs are bounded the same way estimate-meta-reach's are.
const MAX_TERMS_PER_FIELD = 12;
const MAX_TERM_LENGTH = 100;

function sanitizeStringArray(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .slice(0, maxItems)
    .map((s) => s.trim().slice(0, maxLength));
}

function readCredentials(): GoogleAdsCredentials | null {
  const developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');
  const clientId = Deno.env.get('GOOGLE_ADS_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_ADS_CLIENT_SECRET');
  const refreshToken = Deno.env.get('GOOGLE_ADS_REFRESH_TOKEN');
  const customerId = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID');
  const loginCustomerId = Deno.env.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID');

  if (!developerToken || !clientId || !clientSecret || !refreshToken || !customerId || !loginCustomerId) {
    return null;
  }
  return {
    developerToken,
    clientId,
    clientSecret,
    refreshToken,
    customerId: customerId.replace(/-/g, ''),
    loginCustomerId: loginCustomerId.replace(/-/g, ''),
  };
}

async function fetchAccessToken(creds: GoogleAdsCredentials): Promise<string> {
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: creds.clientId,
      client_secret: creds.clientSecret,
      refresh_token: creds.refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const data = await response.json();
  if (!response.ok || typeof data.access_token !== 'string') {
    console.error('Google OAuth token refresh failed:', data);
    throw new Error(data?.error_description || 'Failed to refresh Google Ads access token');
  }
  return data.access_token;
}

function escapeGaql(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function gaqlSearch(
  query: string,
  accessToken: string,
  creds: GoogleAdsCredentials
): Promise<Record<string, unknown>[]> {
  const url = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}/customers/${creds.customerId}/googleAds:search`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': creds.developerToken,
      'login-customer-id': creds.loginCustomerId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Google Ads search error:', data);
    throw new Error(data?.error?.message || `Google Ads search failed: ${response.status}`);
  }
  return data.results ?? [];
}

function pickBestMatch(query: string, candidates: CatalogMatch[]): CatalogMatch | null {
  if (!candidates.length) return null;
  const normalized = query.toLowerCase().trim();
  const exact = candidates.find((c) => c.name.toLowerCase() === normalized);
  return exact || candidates[0];
}

// Primary catalog: user_interest covers AFFINITY and IN_MARKET audiences, the main
// audience-targeting concepts shared between Search Display and YouTube.
async function searchUserInterest(
  name: string,
  accessToken: string,
  creds: GoogleAdsCredentials
): Promise<CatalogMatch | null> {
  const escaped = escapeGaql(name);
  const query = `SELECT user_interest.name, user_interest.taxonomy_type FROM user_interest WHERE user_interest.name LIKE '%${escaped}%' LIMIT 5`;
  const results = await gaqlSearch(query, accessToken, creds);
  const candidates: CatalogMatch[] = results.map((r) => {
    const userInterest = (r.userInterest ?? {}) as Record<string, unknown>;
    return {
      name: String(userInterest.name ?? ''),
      category: String(userInterest.taxonomyType ?? 'AFFINITY'),
    };
  }).filter((c) => c.name);
  return pickBestMatch(name, candidates);
}

// Fallback catalog: topic_constant, for YouTube/Display contextual topics that
// don't have a matching audience interest.
async function searchTopicConstant(
  name: string,
  accessToken: string,
  creds: GoogleAdsCredentials
): Promise<CatalogMatch | null> {
  const escaped = escapeGaql(name);
  const query = `SELECT topic_constant.path FROM topic_constant WHERE topic_constant.path LIKE '%${escaped}%' LIMIT 5`;
  const results = await gaqlSearch(query, accessToken, creds);
  const candidates: CatalogMatch[] = results.map((r) => {
    const topicConstant = (r.topicConstant ?? {}) as Record<string, unknown>;
    const path = Array.isArray(topicConstant.path) ? (topicConstant.path as string[]) : [];
    return { name: path[path.length - 1] ?? '', category: 'topic' };
  }).filter((c) => c.name);
  return pickBestMatch(name, candidates);
}

async function resolveTerm(
  name: string,
  type: 'interest' | 'behavior',
  accessToken: string,
  creds: GoogleAdsCredentials
): Promise<ResolvedSelection> {
  let match = await searchUserInterest(name, accessToken, creds).catch((error) => {
    console.error(`Failed to resolve user_interest "${name}":`, error);
    return null;
  });

  if (!match) {
    match = await searchTopicConstant(name, accessToken, creds).catch((error) => {
      console.error(`Failed to resolve topic_constant "${name}":`, error);
      return null;
    });
  }

  if (match) {
    return { name: match.name, type, matched: true, category: match.category };
  }
  return { name, type, matched: false };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: EstimateInput = await req.json();
    const interests = sanitizeStringArray(input.interests, MAX_TERMS_PER_FIELD, MAX_TERM_LENGTH);
    const behaviors = sanitizeStringArray(input.behaviors, MAX_TERMS_PER_FIELD, MAX_TERM_LENGTH);

    if (interests.length === 0 && behaviors.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'At least one interest or behavior is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const creds = readCredentials();
    if (!creds) {
      return new Response(
        JSON.stringify({ success: false, error: 'Google Ads credentials are not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const accessToken = await fetchAccessToken(creds);

    console.log('Resolving YouTube audience selections:', { interests, behaviors });

    const [interestSelections, behaviorSelections] = await Promise.all([
      Promise.all(interests.map((name) => resolveTerm(name, 'interest', accessToken, creds))),
      Promise.all(behaviors.map((name) => resolveTerm(name, 'behavior', accessToken, creds))),
    ]);

    const selections = [...interestSelections, ...behaviorSelections];

    console.log('YouTube audience resolution complete:', {
      matched: selections.filter((s) => s.matched).length,
      unmatched: selections.filter((s) => !s.matched).length,
    });

    return new Response(
      JSON.stringify({ success: true, selections }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('YouTube audience estimate error:', error);
    const errorMessage = error instanceof Error ? error.message : 'YouTube audience validation failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
