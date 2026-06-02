// Validates a Meta targeting strategy against Meta's real ad-interest library and
// returns an audience-size (reach) estimate. Built to run against a Meta SANDBOX
// ad account — the API works read+write but never delivers ads or spends. Swap the
// token for a real read-only (ads_read) account to get true live estimates.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GRAPH = 'https://graph.facebook.com/v21.0';

interface MetaReachInput {
  interests: string[];
  behaviors?: string[];
  geoLocations?: { countries: string[] };
}

interface ResolvedInterest {
  name: string;
  id: string | null;
  matched: boolean;
  audienceSize?: number | null;
}

function token(): string {
  const t = Deno.env.get('META_ACCESS_TOKEN');
  if (!t) throw new Error('META_ACCESS_TOKEN not configured');
  return t;
}

function adAccountId(): string {
  const id = Deno.env.get('META_AD_ACCOUNT_ID');
  if (!id) throw new Error('META_AD_ACCOUNT_ID not configured');
  return id.startsWith('act_') ? id : `act_${id}`;
}

// Resolve an interest name to a Meta interest id via the targeting search endpoint.
async function resolveInterest(name: string): Promise<ResolvedInterest> {
  const url = `${GRAPH}/search?type=adinterest&q=${encodeURIComponent(name)}&limit=1&access_token=${token()}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    // Rate limit (code 4 / 17) bubbles up to the caller as a soft failure.
    throw new Error(data?.error?.message || `Meta interest search failed: ${res.status}`);
  }

  const hit = data?.data?.[0];
  if (!hit) return { name, id: null, matched: false };
  const size = hit.audience_size_upper_bound ?? hit.audience_size ?? null;
  return { name, id: hit.id, matched: true, audienceSize: size };
}

function classify(upper: number): 'too-narrow' | 'healthy' | 'too-broad' {
  if (upper < 50_000) return 'too-narrow';
  if (upper > 10_000_000) return 'too-broad';
  return 'healthy';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: MetaReachInput = await req.json();
    const interests = [...new Set((input.interests ?? []).map((i) => i.trim()).filter(Boolean))];
    if (interests.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No interests provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Step 1 — resolve interest names to ids (in parallel, soft-fail per interest).
    const resolved = await Promise.all(
      interests.map(async (name) => {
        try {
          return await resolveInterest(name);
        } catch (e) {
          console.error('Interest resolve failed:', name, e);
          return { name, id: null, matched: false } as ResolvedInterest;
        }
      }),
    );

    const matchedIds = resolved.filter((r) => r.matched && r.id).map((r) => ({ id: r.id, name: r.name }));

    // Step 2 — reach estimate for the matched interests (default US geo).
    let audienceSize = { lower: 0, upper: 0 };
    if (matchedIds.length > 0) {
      const targetingSpec = {
        geo_locations: input.geoLocations ?? { countries: ['US'] },
        flexible_spec: [{ interests: matchedIds }],
      };
      const url = `${GRAPH}/${adAccountId()}/reachestimate?targeting_spec=${encodeURIComponent(
        JSON.stringify(targetingSpec),
      )}&access_token=${token()}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error?.message || `Meta reachestimate failed: ${res.status}`);
      }
      const d = data?.data ?? {};
      // Newer API returns users_lower_bound/users_upper_bound; older returns users.
      audienceSize = {
        lower: d.users_lower_bound ?? d.users ?? 0,
        upper: d.users_upper_bound ?? d.users ?? 0,
      };
    }

    const estimate = {
      resolvedInterests: resolved,
      audienceSize,
      suggestion: classify(audienceSize.upper || audienceSize.lower),
    };

    return new Response(
      JSON.stringify({ success: true, estimate }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('estimate-meta-reach error:', error);
    const message = error instanceof Error ? error.message : 'Meta reach estimate failed';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
