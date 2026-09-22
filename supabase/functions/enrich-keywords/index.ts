// Enriches Google Search target keywords with real demand data from DataForSEO.
// Pulls the SAME Google Keyword Planner metrics (search volume, CPC, competition)
// without needing Google Ads API Standard access — Explorer-tier access (the
// instant, no-review tier this app otherwise uses) explicitly excludes Keyword
// Planner. Defaults to DataForSEO's FREE sandbox so the integration can be built
// and demoed with zero credit spend — flip DATAFORSEO_BASE to
// "https://api.dataforseo.com" for live data.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EnrichKeywordsInput {
  keywords?: string[];
  locationCode?: number; // DataForSEO location code, default 2840 (United States)
  languageCode?: string; // default "en"
}

interface KeywordMetric {
  keyword: string;
  volume: number | null;
  cpc: number | null;
  competition: number | null; // 0-1
  difficulty: number | null;  // 0-100 band (competition_index proxy)
}

// This function has verify_jwt = false (called anonymously from the browser), so
// input is bounded to cap worst-case DataForSEO credit usage once live credentials
// are set (the free sandbox is unaffected, but this should hold regardless).
const MAX_KEYWORDS = 30;
const MAX_KEYWORD_LENGTH = 100;

function sanitizeKeywords(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const v of value) {
    if (typeof v !== 'string') continue;
    const trimmed = v.trim().slice(0, MAX_KEYWORD_LENGTH).toLowerCase();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
    if (result.length >= MAX_KEYWORDS) break;
  }
  return result;
}

function basicAuthHeader(): string {
  const login = Deno.env.get('DATAFORSEO_LOGIN');
  const password = Deno.env.get('DATAFORSEO_PASSWORD');
  if (!login || !password) {
    throw new Error('DataForSEO credentials not configured');
  }
  return 'Basic ' + btoa(`${login}:${password}`);
}

async function fetchKeywordMetrics(
  keywords: string[],
  locationCode: number,
  languageCode: string
): Promise<KeywordMetric[]> {
  // Live Keyword Planner data (consumes DataForSEO credits per lookup).
  const base = 'https://api.dataforseo.com';

  const response = await fetch(`${base}/v3/keywords_data/google_ads/search_volume/live`, {
    method: 'POST',
    headers: {
      'Authorization': basicAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      {
        keywords,
        location_code: locationCode,
        language_code: languageCode,
      },
    ]),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('DataForSEO HTTP error:', response.status, data?.status_message);
    throw new Error(data?.status_message || `DataForSEO request failed: ${response.status}`);
  }

  const task = data?.tasks?.[0];
  // 20000 = OK. Money/limit issues surface as a task status_code (e.g. 40200).
  if (!task || task.status_code !== 20000) {
    console.error('DataForSEO task error:', task?.status_code, task?.status_message);
    throw new Error(task?.status_message || 'DataForSEO returned no usable result');
  }

  const results: Array<Record<string, unknown>> = task.result ?? [];
  return results.map((r) => {
    const competitionIndex = typeof r.competition_index === 'number' ? r.competition_index : null;
    return {
      keyword: String(r.keyword ?? ''),
      volume: typeof r.search_volume === 'number' ? r.search_volume : null,
      cpc: typeof r.cpc === 'number' ? r.cpc : null,
      competition: competitionIndex !== null ? Math.round((competitionIndex / 100) * 100) / 100 : null,
      // DataForSEO's search_volume endpoint has no true KD; competition_index (0-100)
      // is the closest single difficulty signal.
      difficulty: competitionIndex,
    };
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: EnrichKeywordsInput = await req.json();
    const keywords = sanitizeKeywords(input.keywords);
    const locationCode = typeof input.locationCode === 'number' ? input.locationCode : 2840;
    const languageCode = typeof input.languageCode === 'string' ? input.languageCode.slice(0, 10) : 'en';

    if (keywords.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No keywords provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const metrics = await fetchKeywordMetrics(keywords, locationCode, languageCode);
    return new Response(
      JSON.stringify({ success: true, metrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('enrich-keywords error:', error);
    const message = error instanceof Error ? error.message : 'Keyword enrichment failed';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
