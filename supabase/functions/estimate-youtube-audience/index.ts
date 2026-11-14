// Validates a YouTube targeting strategy's interests/behaviors against Google Ads'
// real audience catalogs (user_interest, with topic_constant as a fallback) so a
// marketer sees the same targetable names they'd pick in Google Ads. YouTube
// campaigns are managed inside Google Ads and draw on these same catalogs — this
// reuses the operator's Google Cloud project's Google Ads API access rather than
// needing a separate YouTube-specific credential. Developer tokens were sunset on
// 2026-09-09: access levels now belong to the Cloud project that owns the OAuth
// client, so no developer token or manager account is required (both are still
// honored if set). The API itself does not accept API keys — OAuth is required.
// Test access only reaches test accounts; Explorer is needed for production
// accounts. Explorer gives real catalog names/IDs but not a reach estimate (that
// needs Basic/Standard access), so unlike Meta this only returns matched/unmatched
// status, not an audience size.

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
  developerToken?: string; // Optional: sunset 2026-09-09, sent only if configured
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string;
  loginCustomerId?: string; // Optional: only needed when querying through a manager account
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

  // Developer token and login customer ID are optional (see header comment).
  if (!clientId || !clientSecret || !refreshToken || !customerId) {
    return null;
  }
  return {
    developerToken: developerToken || undefined,
    clientId,
    clientSecret,
    refreshToken,
    customerId: customerId.replace(/-/g, ''),
    loginCustomerId: loginCustomerId ? loginCustomerId.replace(/-/g, '') : undefined,
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
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };
  if (creds.developerToken) headers['developer-token'] = creds.developerToken;
  if (creds.loginCustomerId) headers['login-customer-id'] = creds.loginCustomerId;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error('Google Ads search error:', JSON.stringify(data));
    throw new Error(data?.error?.message || `Google Ads search failed: ${response.status}`);
  }
  return data.results ?? [];
}

const STOP_WORDS = new Set(['and','or','the','of','for','in','on','a','an','to','with','&','people','users','enthusiasts','professionals','fans','lovers']);

// Words too generic to justify a match on their own (e.g. "Laboratory equipment"
// must not resolve to "Exercise Equipment").
const GENERIC_WORDS = new Set(['equipment','services','service','products','product','software','tools','solutions','research','management','supplies','industry','business','online','general','other','related']);

function tokens(value: string): string[] {
  return value.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

// Exact (case-insensitive) match wins; otherwise the candidate sharing the most
// meaningful word stems with the query. Irrelevant fuzzy matches are rejected.
function pickBestMatch(query: string, candidates: CatalogMatch[]): CatalogMatch | null {
  const normalized = query.toLowerCase().trim();
  const exact = candidates.find((c) => c.name.toLowerCase() === normalized);
  if (exact) return exact;
  const qTokens = tokens(query);
  if (!qTokens.length) return null;
  const stem = (t: string) => t.replace(/(ies|es|s|ing|al|y)$/, '');
  const qStems = qTokens.map(stem);
  let best: { match: CatalogMatch; score: number } | null = null;
  for (const c of candidates) {
    const cStems = tokens(c.name).map(stem);
    if (!cStems.length) continue;
    const sharedTokens = qTokens.filter((_, i) => cStems.some((cs) => { const q = qStems[i]; return cs === q || (q.length > 4 && cs.length > 4 && (cs.startsWith(q) || q.startsWith(cs))); }));
    const shared = sharedTokens.length;
    if (!shared || sharedTokens.every((t) => GENERIC_WORDS.has(t))) continue;
    const score = shared / qStems.length + shared / cStems.length;
    if (!best || score > best.score) best = { match: c, score };
  }
  return best && best.score >= 0.5 ? best.match : null;
}

// Catalogs are static reference data, so load each once per warm instance and
// match locally (GAQL LIKE is case-sensitive and can't filter topic paths).
let userInterestCache: Promise<CatalogMatch[]> | null = null;
let topicCache: Promise<CatalogMatch[]> | null = null;

function loadUserInterests(accessToken: string, creds: GoogleAdsCredentials): Promise<CatalogMatch[]> {
  if (!userInterestCache) {
    userInterestCache = gaqlSearch(
      "SELECT user_interest.name, user_interest.taxonomy_type, user_interest.launched_to_all FROM user_interest WHERE user_interest.taxonomy_type IN ('AFFINITY', 'IN_MARKET')",
      accessToken, creds
    ).then((results) => results.map((r) => {
      const ui = (r.userInterest ?? {}) as Record<string, unknown>;
      return { name: String(ui.name ?? '').split('/').pop()!.trim(), category: String(ui.taxonomyType ?? 'AFFINITY') };
    }).filter((c) => c.name)).catch((e) => { userInterestCache = null; throw e; });
  }
  return userInterestCache;
}

function loadTopics(accessToken: string, creds: GoogleAdsCredentials): Promise<CatalogMatch[]> {
  if (!topicCache) {
    topicCache = gaqlSearch('SELECT topic_constant.path FROM topic_constant', accessToken, creds)
      .then((results) => results.map((r) => {
        const tc = (r.topicConstant ?? {}) as Record<string, unknown>;
        const path = Array.isArray(tc.path) ? (tc.path as string[]) : [];
        return { name: path[path.length - 1] ?? '', category: 'topic' };
      }).filter((c) => c.name)).catch((e) => { topicCache = null; throw e; });
  }
  return topicCache;
}

async function resolveTerm(
  name: string,
  type: 'interest' | 'behavior',
  accessToken: string,
  creds: GoogleAdsCredentials
): Promise<ResolvedSelection> {
  const interests = await loadUserInterests(accessToken, creds).catch((error) => {
    console.error('Failed to load user_interest catalog:', error);
    return [] as CatalogMatch[];
  });
  let match = pickBestMatch(name, interests);
  if (!match) {
    const topics = await loadTopics(accessToken, creds).catch((error) => {
      console.error('Failed to load topic_constant catalog:', error);
      return [] as CatalogMatch[];
    });
    match = pickBestMatch(name, topics);
  }
  if (match) return { name: match.name, type, matched: true, category: match.category };
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
