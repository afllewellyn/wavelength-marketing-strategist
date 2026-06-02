// Enriches suggested subreddits with real subscriber counts so community targeting
// is ranked by actual reach. Strictly READ-ONLY — this planning tool never creates
// Reddit campaigns. Uses an OAuth token (ads:read / read scope) when REDDIT_ACCESS_TOKEN
// is set, otherwise falls back to Reddit's public about.json (UA-throttled).

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UA = 'wavelength-marketing-strategist/1.0 (planning tool; read-only)';

interface RedditInput {
  communities: string[];
}

interface RedditCommunityMetric {
  name: string;
  subscribers: number | null;
  matched: boolean;
}

async function fetchSubreddit(name: string): Promise<RedditCommunityMetric> {
  const clean = name.replace(/^\/?r\//i, '').trim();
  const tokenVal = Deno.env.get('REDDIT_ACCESS_TOKEN');

  const base = tokenVal ? 'https://oauth.reddit.com' : 'https://www.reddit.com';
  const headers: Record<string, string> = { 'User-Agent': UA };
  if (tokenVal) headers['Authorization'] = `Bearer ${tokenVal}`;

  const res = await fetch(`${base}/r/${encodeURIComponent(clean)}/about.json`, { headers });
  if (!res.ok) {
    // 404 / private / banned -> treat as unmatched rather than throwing the whole batch.
    return { name: clean, subscribers: null, matched: false };
  }
  const data = await res.json();
  const subs = data?.data?.subscribers;
  if (typeof subs !== 'number') {
    return { name: clean, subscribers: null, matched: false };
  }
  return { name: clean, subscribers: subs, matched: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: RedditInput = await req.json();
    const communities = [...new Set((input.communities ?? []).map((c) => c.trim()).filter(Boolean))];
    if (communities.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No communities provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const metrics = await Promise.all(
      communities.map(async (c) => {
        try {
          return await fetchSubreddit(c);
        } catch (e) {
          console.error('Subreddit fetch failed:', c, e);
          return { name: c.replace(/^\/?r\//i, ''), subscribers: null, matched: false };
        }
      }),
    );

    // Rank by reach (largest first), unmatched last.
    metrics.sort((a, b) => (b.subscribers ?? -1) - (a.subscribers ?? -1));

    return new Response(
      JSON.stringify({ success: true, metrics }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('enrich-reddit error:', error);
    const message = error instanceof Error ? error.message : 'Reddit enrichment failed';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
