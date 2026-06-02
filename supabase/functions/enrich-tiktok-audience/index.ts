// Validates suggested TikTok interests against TikTok's real interest-category
// taxonomy so the strategy maps to targetable categories. Designed for TikTok
// Sandbox mode (no app review needed); read-only — never launches campaigns.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TiktokInput {
  interests: string[];
}

interface TiktokInterestMatch {
  name: string;
  categoryId: string | null;
  matched: boolean;
}

async function fetchInterestCategories(): Promise<{ id: string; name: string }[]> {
  const token = Deno.env.get('TIKTOK_ACCESS_TOKEN');
  const advertiserId = Deno.env.get('TIKTOK_ADVERTISER_ID');
  if (!token || !advertiserId) {
    throw new Error('TikTok credentials not configured');
  }
  const base = Deno.env.get('TIKTOK_BASE') ?? 'https://business-api.tiktok.com';

  const url = `${base}/open_api/v1.3/tool/interest_category/?advertiser_id=${encodeURIComponent(
    advertiserId,
  )}&placements=["PLACEMENT_TIKTOK"]&version=2`;

  const res = await fetch(url, { headers: { 'Access-Token': token } });
  const data = await res.json();

  // TikTok wraps errors in a non-zero `code` even on HTTP 200.
  if (!res.ok || (typeof data?.code === 'number' && data.code !== 0)) {
    throw new Error(data?.message || `TikTok interest_category failed: ${res.status}`);
  }

  const list: Array<Record<string, unknown>> =
    data?.data?.interest_categories ?? data?.data?.list ?? [];
  return list.map((c) => ({
    id: String(c.interest_category_id ?? c.id ?? ''),
    name: String(c.interest_category_name ?? c.name ?? ''),
  }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const input: TiktokInput = await req.json();
    const interests = [...new Set((input.interests ?? []).map((i) => i.trim()).filter(Boolean))];
    if (interests.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'No interests provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const categories = await fetchInterestCategories();

    const matches: TiktokInterestMatch[] = interests.map((name) => {
      const q = name.toLowerCase();
      const hit = categories.find(
        (c) => c.name.toLowerCase() === q || c.name.toLowerCase().includes(q) || q.includes(c.name.toLowerCase()),
      );
      return hit ? { name, categoryId: hit.id, matched: true } : { name, categoryId: null, matched: false };
    });

    return new Response(
      JSON.stringify({ success: true, matches }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('enrich-tiktok-audience error:', error);
    const message = error instanceof Error ? error.message : 'TikTok enrichment failed';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
