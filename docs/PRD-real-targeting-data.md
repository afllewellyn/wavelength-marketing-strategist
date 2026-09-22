# PRD: Real Ad-Platform Targeting Data in Wavelength

| | |
|---|---|
| Status | **Phase 1 done for Meta; Phase 2 (Google/YouTube split) built, awaiting credentials.** Pinterest/TikTok not started. |
| Owner | afllewellyn |
| Last updated | 2026-09-22 |
| Branch | `claude/modest-rubin-agqp04` — [PR #3](https://github.com/afllewellyn/wavelength-marketing-strategist/pull/3) |

---

## 0. Implementation status (2026-09-22)

**Meta — shipped.** `supabase/functions/estimate-meta-reach/index.ts`, merged to `main` (PR #2). It satisfies Goals 1, 2, and 5 of this PRD for Meta specifically:

- Resolves LLM-suggested interests and behaviors against Meta's real `search?type=adinterest` / `adTargetingCategory&class=behaviors` catalogs, with a Lovable-AI-suggested-alternative fallback when the first lookup misses.
- Returns a combined audience reach estimate via `reachestimate`, with interests and behaviors merged into a single `flexible_spec` entry so the estimate reflects one OR'd Detailed Targeting group (an initial AND-instead-of-OR bug was caught in QA and fixed).
- Fails soft: Meta errors surface as `metaAudienceError` on the result without blocking the core report, per Goal 5.
- Input is bounded (12 terms/field, 100 chars/term, 10 countries) since the function is called with `verify_jwt = false`, per a security-review finding.

**LinkedIn job-title grounding — shipped**, on PR #3. `src/lib/linkedin/parseTitles.ts` + a conditional upload field in `AnalysisForm.tsx`, ported from `claude/seo-meta-social-mcps-rBh3g` and rewired onto main's current types/AnalysisForm/analyze-website shape. Since LinkedIn has no public targeting-verification API (confirmed — see Non-goals below), this doesn't fit the "verify against a platform catalog" pattern the rest of this PRD defines; instead the operator uploads their own job-title list (.xlsx/.csv, browser-parsed, never leaves the device), and `analyze-website`'s prompt is constrained to only choose `linkedinTargeting.jobTitles` from that list. Bounded to 200 titles / 100 chars each at the edge function, matching the Meta function's input-bounding pattern.

**Google (Search) + YouTube — built on PR #3, not yet live** (no `DATAFORSEO_*` or `GOOGLE_ADS_*` secrets set in Lovable yet). This locks in the platform → data-source split decided today:

| Platform | Field enriched | Data source | Function |
|---|---|---|---|
| Google (Search) | `targetingStrategy.keywords` → `keywordMetrics` (volume, CPC, competition) | DataForSEO (Keyword Planner data, free sandbox by default) | `supabase/functions/enrich-keywords/index.ts` |
| YouTube | `targetingStrategy.interests`/`behaviors` → `youtubeAudience` (matched/unmatched + real name + category) | Google Ads API catalogs (`user_interest`, `topic_constant` fallback) via the operator's own dev token | `supabase/functions/estimate-youtube-audience/index.ts` |

This retires the earlier plan of one generalized `google.ts` adapter serving both Search-keyword and YouTube-interest verification (section 7.1/7.3 as originally written) — in practice these are different Google surfaces (a keyword-demand API vs. an audience-catalog API) with different data providers, so they ship as two separate, independently-failing edge functions, each gated on `platform` in `src/lib/api/analysis.ts` and each failing soft (`keywordMetricsError` / `youtubeAudienceError`) exactly like Meta's `metaAudienceError`.

Notes on what shipped:
- `enrich-keywords` — ported from `claude/seo-meta-social-mcps-rBh3g` with the same `verify_jwt = false` input-bounding fix `estimate-meta-reach` got (30 keywords max, 100 chars each, de-duped).
- `estimate-youtube-audience` — new. Refreshes a Google Ads OAuth access token per invocation (no token cache/`platform_tokens` table yet — fine at current traffic, see section 7.6), then resolves each interest/behavior against `user_interest` (AFFINITY/IN_MARKET taxonomy) with a `topic_constant` fallback, same bounding as Meta's function (12 terms/field, 100 chars). Uses the non-streaming `googleAds:search` endpoint rather than `searchStream` from section 5.4's curl example — same GAQL semantics, simpler response parsing for small bounded queries. **No reach estimate** — Explorer-tier access doesn't provide one (see section 5.4); only real catalog names and matched/unmatched status.
- Both are wired into `analyzeWebsite()` exactly like Meta: fire only for their platform, never block the core report, UI panels added to `TargetingStrategyCard.tsx`, exports updated in `formatters.ts`/`csv.ts`.
- **Not yet live**: needs `DATAFORSEO_LOGIN`/`DATAFORSEO_PASSWORD` (optional — defaults to the free sandbox with no setup) and all six `GOOGLE_ADS_*` secrets from section 5.4 set in Lovable before either does anything beyond return "not configured".

**Pinterest, TikTok, Reddit**: not started.

**Remaining unmerged work on `claude/seo-meta-social-mcps-rBh3g`** (LinkedIn upload and the DataForSEO function are now ported out of it):
- An older `estimate-meta-reach` — superseded by `main`'s version, do not resurrect.
- `enrich-reddit` and `enrich-tiktok-audience` — functional, outside this PRD's current priority order.

See the branch-cleanup note at the end of this doc.

---

## 1. Summary

Wavelength Marketing Strategist turns a product URL and a short brief into ICPs, a per-platform targeting strategy, and ad copy. Today **every targeting suggestion is generated by an LLM with no contact with any ad platform**. Interests, behaviors, and audience sizes are plausible guesses, not things a media planner can actually select in Meta Ads Manager, Google Ads, Pinterest, or TikTok.

This PRD defines how to ground those suggestions in the platforms' real targeting catalogs via **read-only, operator-owned API credentials** called from Supabase Edge Functions. The result: every suggested interest is marked as verified-on-platform or unmatched, and where the platform supports it, an estimated audience reach is shown.

The intent is to **publish the app for other media planners**, so the design avoids per-user OAuth entirely. One set of tokens owned by the app operator serves all users, which works because targeting catalogs are platform-wide, not account-specific.

## 2. Background and decisions already made

### 2.1 Current state of the repo

- Stack: Vite + React 18 + TypeScript + shadcn/ui + Tailwind; Supabase Edge Functions (Deno) for the backend; Vitest for tests. Originally scaffolded with Lovable, but it is plain code that can be developed directly.
- The only backend is `supabase/functions/analyze-website/index.ts`. It calls Firecrawl to scrape the site and the Lovable AI gateway (`google/gemini-3-flash-preview`) to produce the JSON result. No ad platform API is called anywhere.
- Domain model lives in `src/types/analysis.ts`. `Platform = 'meta' | 'tiktok' | 'youtube' | 'reddit' | 'linkedin' | 'google'`. `TargetingStrategy` carries `interests`, `behaviors`, `keywords`, `communities`, `linkedinTargeting`, `placements`, `exclusions`, `funnelStage`.
- `src/components/wavelength/TargetingStrategyCard.tsx` renders those fields as badge chips per platform.
- `.lovable/plan.md` (commit `86d9115`, never implemented) already sketched a Meta reach-estimate edge function and a Semrush keyword enrichment. This PRD supersedes the Meta part and generalizes it to four platforms.
- There is no MCP configuration in the repo.

### 2.2 MCP vs. API: why the app uses APIs

Model Context Protocol (MCP) connectors were evaluated first. Conclusion:

- **MCP connectors only serve Claude sessions** (claude.ai chat, Claude Code). They give the operator live read access to their own ad accounts for research and planning. They cannot be called from the deployed app's edge functions.
- Therefore the **published app must call the platforms' REST APIs directly.**
- Both can coexist: MCP for the operator's own research, APIs for the product.

Reference notes on the MCP option, for when it is wanted:

| Platform | Official MCP | Notes |
|---|---|---|
| Meta | `https://mcp.facebook.com/ads` (remote, open beta since July 2026) | OAuth with Meta Business login, no app review. **Write tools are on by default**; disable them under Business Settings > Integrations > Ads MCP Server. |
| Google Ads | `github.com/googleads/google-ads-mcp` (local stdio or self-hosted) | Read-only by design: only `search` (GAQL), `get_resource_metadata`, `list_accessible_customers`. Needs a developer token + OAuth. |
| Pinterest | Official server, read-only alpha (June 2026) | |
| TikTok | Official server via TikTok Agentic Hub | Read/write. |
| Microsoft Ads, Amazon Ads | Official servers exist (read-only pilot / open beta) | Out of scope. |
| LinkedIn, Reddit | No official server | Third-party only. |

**MCP Bundles (mcpbundles.com) was rejected.** It is a small third-party aggregator that stores your ad-account OAuth tokens server-side. Both Meta and Google are simpler and safer direct, and no official platform relationship or security attestation was found.

### 2.3 Remix vs. keep

No remix is needed. The repo is ordinary Vite/React/Supabase code. The only Lovable-specific pieces are the `lovable-tagger` dev dependency and the LLM call routed through Lovable's AI gateway. Both can stay or be swapped later without affecting this work.

## 3. Goals and non-goals

### Goals

1. For a Meta, Google, Pinterest, or TikTok analysis, check every LLM-suggested interest (and keyword where the platform has a keyword catalog) against the platform's real targeting catalog.
2. Show the user which suggestions are real, selectable targeting options, with the platform's canonical name and ID, and which are not.
3. Where the platform provides it (Meta), show an estimated audience size for the combined targeting and a "too narrow / healthy / too broad" band.
4. Work with **operator-owned, read-only credentials** stored as Supabase secrets. End users never connect an ad account.
5. Degrade gracefully. If a platform's credentials are missing or its API fails, the core report renders exactly as it does today.
6. Support all four platforms through one shared adapter interface so adding a platform is a ~100-line file.

### Non-goals

- Any write access to any ad platform (no campaign creation, no audience creation).
- Per-user OAuth or reading a user's own campaigns. (Possible Phase 3, see section 9.)
- Keyword volume/CPC data (Semrush or Google Keyword Planner). Keyword Planner is blocked on Google's instant Explorer tier; Semrush is a separate initiative.
- Reddit, LinkedIn verification. These platforms stay LLM-only for platform-API verification (LinkedIn and Reddit have no suitable official read APIs for this without partner status). **Confirmed 2026-09-22**: the operator has a hand-compiled LinkedIn job-title file but no public LinkedIn targeting API exists to validate against — a CSV/XLSX upload workaround (browser-parsed, grounds LLM `jobTitles` against the operator's real list) shipped instead on PR #3 (section 0), sidestepping rather than closing this non-goal.
- ~~YouTube verification~~ **Reclassified in scope, 2026-09-22.** YouTube campaigns run inside Google Ads and share its audience catalogs (`user_interest`, `topic_constant`) — see section 0 and section 8's "Why Google split into two functions" note. Shipped on PR #3 as `estimate-youtube-audience`, off the same Google Ads dev token Search keyword enrichment doesn't even use.
- Replacing the LLM. The LLM still proposes; the platforms verify.

## 4. Users and use cases

**Primary user:** a media planner or performance marketer who runs a Wavelength analysis before building campaigns.

- **Verify before building.** Planner picks Meta, gets 8 suggested interests. The card shows 6 with a green check and Meta's canonical name plus audience size, and 2 with a warning that Meta has no such interest. Planner swaps the 2 before opening Ads Manager.
- **Sanity-check reach.** Same run shows "Estimated reach 2.1M to 2.5M people in US, healthy for cold prospecting."
- **Cross-platform reuse.** Planner reruns for Pinterest and sees which of the same concepts exist as Pinterest interests.
- **Operator without keys yet.** A new deployment with no platform secrets shows a muted "Not connected" line on the card and nothing else changes.

## 5. Credential requirements (verified September 2026)

### 5.1 Direct answers to the operator's questions

- **Sandbox accounts: never required.** All four platforms offer sandboxes; none are needed for read-only catalog lookups. Ignore them.
- **Ad-account login: yes, once per platform, using the operator's own account.** Each token is minted by signing in to your own Meta Business Manager, Google Ads manager account, Pinterest Business account, or TikTok Ads Manager. That is unavoidable for ad APIs. **No payment method and no ad spend is required on any of them.**
- **Instant:** Meta, Google. **Short review first:** Pinterest Trial access (reviewed each business day, typically 1 to 3 days, some 2026 reports of longer waits) and TikTok app approval (about 2 to 3 business days).

### 5.2 Comparison

| | Meta | Google Ads | Pinterest | TikTok |
|---|---|---|---|---|
| Free account needed | Business Manager + ad account (no billing) | Manager account / MCC (no billing) | Business account | Ads Manager advertiser (no billing) |
| Approval wait | None | None (Explorer tier, instant) | Trial review, ~1-3 business days | App review, ~2-3 business days |
| Token lifetime | Never expires (System User) | Refresh token; non-expiring if consent screen is "In production" | Access 30 days; refresh 60 days, rotating | Never expires |
| Quota | Dev tier: 60 points per 5 min per ad account (read = 1 pt) | 2,880 operations/day | 1,000 requests/day (Trial) | Standard |
| Catalog call needs an account ID? | `search?type=adinterest`: no. `reachestimate`: yes | Yes (the MCC's own ID works) | Optional query param | Yes (`advertiser_id`) |
| API version to use | Graph v25.0 | v25 | v5 | v1.3 |

### 5.3 Meta: System User token (about 10 minutes)

1. developers.facebook.com > My Apps > **Create App** (type: Business) > add the **Marketing API** product. Development mode is fine. No App Review is needed for `ads_read` against your own accounts.
2. business.facebook.com/settings > Accounts > **Apps** > Add > enter your App ID.
3. Business Settings > Users > **System Users** > Add (role: Admin) > **Add Assets** > Ad Accounts > select your account > enable "View performance".
4. On the system user: **Generate New Token** > pick the app > expiration **Never** > tick **`ads_read`** > Generate > copy it (shown only once).
5. Ad account ID: in Ads Manager the URL contains `act=1234567890`; the secret value is `act_1234567890`.
6. If Generate is greyed out, complete Security Center > Business Verification first.

Secrets: `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`.

Verify:

```bash
T=...; ACT=act_1234567890
curl -s "https://graph.facebook.com/v25.0/debug_token?input_token=$T&access_token=$T"
curl -s "https://graph.facebook.com/v25.0/search?type=adinterest&q=hiking&limit=5&access_token=$T"
curl -s -G "https://graph.facebook.com/v25.0/$ACT/reachestimate" -d "access_token=$T" \
  --data-urlencode 'targeting_spec={"geo_locations":{"countries":["US"]},"flexible_spec":[{"interests":[{"id":"6003139266461"}]}]}'
# expect {"data":{"users_lower_bound":..,"users_upper_bound":..,"estimate_ready":true}}
```

Notes: `geo_locations` is required on `reachestimate` (error subcode 1885364 otherwise). Graph v26.0 removed `daily_outcomes_curve` and `estimate_dau` from `delivery_estimate`; use `reachestimate` for audience size. Meta renamed access tiers in May 2026 to "Limited Access" (default) and "Full Access"; Limited is sufficient here.

### 5.4 Google Ads: developer token + OAuth refresh token (about 20 minutes)

1. ads.google.com/home/tools/manager-accounts > **Create a manager account** (free, no billing).
2. In the manager account: Tools & Settings > Setup > **API Center** > accept terms > the developer token appears. It is granted **Explorer** access instantly: works on production accounts, 2,880 operations/day. Explorer blocks Keyword Planner, Audience Insights, Reach Planner, and account-creation services; plain GAQL constant queries are allowed.
3. Customer ID for queries: use the manager account's own 10-digit ID (dashes removed). Optionally create a client account under it via "Create an account without a campaign" (no billing).
4. console.cloud.google.com > new project > **Enable "Google Ads API"** > OAuth consent screen: External, add yourself as a test user, scope `https://www.googleapis.com/auth/adwords` > **set Publishing status to "In production"**. If left in Testing, refresh tokens expire after 7 days. > Credentials > Create OAuth client ID > **Desktop app** > download the JSON.
5. Mint the refresh token once, locally:

```bash
pip install google-ads
python generate_user_credentials.py -c client_secret.json
# or: oauth2l fetch --credentials client_secret.json --scope adwords --output_format refresh_token
```

Secrets: `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID` (the manager ID; required as a header whenever you query a client account through the manager).

Verify:

```bash
AT=$(curl -s -X POST https://oauth2.googleapis.com/token \
  -d client_id=$CID -d client_secret=$SEC -d refresh_token=$RT -d grant_type=refresh_token | jq -r .access_token)
curl -s -X POST "https://googleads.googleapis.com/v25/customers/$CUST/googleAds:searchStream" \
  -H "Authorization: Bearer $AT" -H "developer-token: $DEV" -H "login-customer-id: $MCC" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT user_interest.user_interest_id, user_interest.name, user_interest.taxonomy_type FROM user_interest LIMIT 20"}'
```

Other catalog queries: `topic_constant` (`id, path`), `geo_target_constant` (`id, name, country_code, target_type`), `detailed_demographic` (`id, name`), `life_event` (`id, name`).

### 5.5 Pinterest: Trial app + OAuth (about 10 minutes plus review)

1. Have a Pinterest **Business** account (free). developers.pinterest.com/apps > Create app > submit for **Trial access**. Trial includes read scopes such as `ads:read` at 1,000 requests/day. Wait for the approval email.
2. My apps > Configure > note App ID and App secret; set a Redirect URI (any HTTPS URL you control, e.g. `https://localhost/cb`).
3. Quick check: Configure > **Generate Access Token** gives a 24-hour test token, enough to verify calls.
4. Production token via the authorization-code flow. Open in a browser:
   `https://www.pinterest.com/oauth/?client_id=APP_ID&redirect_uri=REDIRECT&response_type=code&scope=ads:read&state=x`
   then exchange the `code` from the redirect:

```bash
curl -s -X POST https://api.pinterest.com/v5/oauth/token \
  -H "Authorization: Basic $(printf '%s:%s' $APP_ID $SECRET | base64)" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d grant_type=authorization_code -d code=CODE -d redirect_uri=REDIRECT -d continuous_refresh=true
```

   Returns a 30-day access token and a 60-day **rotating** refresh token. Every refresh returns a new refresh token that must be persisted (see section 7.5).
5. Endpoint: `GET /v5/resources/targeting/{INTEREST|KEYWORD|GEO|LOCATION|AGE_BUCKET|GENDER|LOCALE|APPTYPE}`. `ad_account_id` is an optional query parameter. `GET /v5/ad_accounts` lists your accounts if you want to pass one.

Secrets: `PINTEREST_APP_ID`, `PINTEREST_APP_SECRET`, `PINTEREST_REFRESH_TOKEN` (seed value), optional `PINTEREST_AD_ACCOUNT_ID`.

Verify:

```bash
curl -s https://api.pinterest.com/v5/resources/targeting/INTEREST -H "Authorization: Bearer $T"
```

### 5.6 TikTok: Marketing API app + long-term token (about 15 minutes plus review)

1. ads.tiktok.com > create an advertiser account (free, no billing). Every `/tool/` endpoint requires an `advertiser_id`.
2. business-api.tiktok.com/portal > Create App > product **Marketing API** > scopes **Ad Account Management (read)** and **Ads Management (read)** > set a callback URL > submit. Wait for approval (~2-3 business days). Confirm the exact scope on each `/tool/` endpoint's doc page in the portal.
3. After approval: App detail page > **Authorization URL** > open it, log in, authorize your advertiser > the redirect carries an `auth_code` (valid 1 hour, single use).
4. Exchange:

```bash
curl -s -X POST https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/ \
  -H "Content-Type: application/json" \
  -d '{"app_id":"APP_ID","secret":"SECRET","auth_code":"AUTH_CODE"}'
# data.access_token (does not expire), data.advertiser_ids[]
```

Secrets: `TIKTOK_ACCESS_TOKEN`, `TIKTOK_ADVERTISER_ID`.

Verify:

```bash
curl -s -G https://business-api.tiktok.com/open_api/v1.3/tool/interest_category/ \
  -H "Access-Token: $T" --data-urlencode advertiser_id=$ADV --data-urlencode version=2
# expect "code":0
```

### 5.7 Items not fully verified

The official documentation sites for all four platforms were unreachable from the research environment, so these rest on official blog snippets, SDK sources, OpenAPI specs, and consistent third-party guides:

- Meta: whether `reachestimate` requires any billing setup (no source says it does); whether Business Verification is required to generate a System User token (some guides say yes).
- Google: whether test accounts return the full interest catalog (irrelevant to this design, which uses production Explorer access).
- TikTok: the exact permission scope that gates `/tool/` endpoints; the "never expires" claim for the advertiser token comes from integration vendors' docs.
- Pinterest: behaviour when `ad_account_id` is omitted from `/resources/targeting/{type}`.

Each is cheap to confirm with the curl checks above once credentials exist.

## 6. Functional requirements

### 6.1 Edge function contract

`POST /functions/v1/targeting-options`

Request:

```json
{
  "platform": "meta",
  "interests": ["Hiking", "Trail running"],
  "keywords": ["waterproof hiking boots"],
  "countries": ["US"]
}
```

Response:

```json
{
  "platform": "meta",
  "available": true,
  "resolved": [
    { "query": "Hiking", "type": "interest", "matched": true, "id": "6003139266461", "name": "Hiking", "category": "Sports and outdoors", "audienceSize": { "lower": 210000000, "upper": 250000000 } },
    { "query": "Trail running", "type": "interest", "matched": false }
  ],
  "reach": { "lower": 2100000, "upper": 2500000, "band": "healthy" },
  "error": null
}
```

Rules:

- `available: false` immediately for `youtube`, `reddit`, `linkedin`, and for any supported platform whose secrets are absent. No error is raised; the frontend treats it as "not connected".
- A platform API failure returns `available: true`, `resolved: []`, and a short `error` string. It never returns a non-2xx to the client.
- Interests and keywords are de-duplicated and trimmed before lookup. Results are cached in memory for the invocation.
- `reach` is present only for Meta (the only platform in scope with a public reach-estimate endpoint) and only when at least one interest matched.
- Band thresholds: below 50,000 = `too-narrow`; 50,000 to 10,000,000 = `healthy`; above 10,000,000 = `too-broad` (carried over from `.lovable/plan.md`).

### 6.2 Matching rules

- Exact match after normalization (lowercase, trim, collapse whitespace, strip punctuation) wins.
- Otherwise the first platform result whose normalized name contains the query, or vice versa, is accepted and flagged `fuzzy: true` in the resolved entry so the UI can show the canonical name.
- No match after that = `matched: false`. The LLM's original text is kept as `query` so the user sees what to replace.

### 6.3 UI behaviour

- Trigger: after `analyzeWebsite` resolves and the platform is one of the four, the frontend calls `lookupTargetingOptions` in the background. The core report renders immediately; the verification layer arrives when ready.
- Interest and behaviour chips gain a leading check mark (matched) or warning icon (unmatched). Hovering a matched chip shows the platform's canonical name, ID, and audience size if present.
- A new "Verified on {Platform}" panel inside `TargetingStrategyCard` shows: match count ("6 of 8 interests exist on Meta"), the reach range and band note when present, and a loading skeleton while pending.
- When `available: false`: one muted line, "Live verification not connected for {Platform}", and no chip decorations.
- When `error` is set: one muted line with the message, and no chip decorations.
- CSV and clipboard exports include `matched`, `platformName`, `platformId`, and `audienceSize` columns when the data exists.

## 7. Technical design

### 7.1 File layout

```
supabase/functions/targeting-options/
  index.ts                 request parsing, adapter dispatch, CORS, error envelope
  adapters/
    types.ts               shared interfaces
    matching.ts            normalize + match helpers
    bands.ts               reach band thresholds
    tokenStore.ts          read/write platform_tokens (service role)
    meta.ts
    pinterest.ts
    google.ts
    tiktok.ts
supabase/migrations/<timestamp>_platform_tokens.sql
src/types/analysis.ts      add ResolvedTarget, TargetingLookupResult, targetingValidation on AnalysisResult
src/lib/api/analysis.ts    add lookupTargetingOptions()
src/pages/Index.tsx        fire lookup after analysis; merge into state
src/components/wavelength/TargetingStrategyCard.tsx   chip decorations + Verified panel
src/lib/export/formatters.ts, csv.ts                  new columns
docs/ad-platform-apis.md   operator runbook (sections 5.3 to 5.6 of this PRD, plus `supabase secrets set` commands)
```

### 7.2 Shared types

```ts
type SupportedPlatform = 'meta' | 'google' | 'pinterest' | 'tiktok';

interface TargetingLookupInput {
  platform: Platform;
  interests: string[];
  keywords?: string[];
  countries?: string[];   // default ['US']
}

interface ResolvedTarget {
  query: string;
  type: 'interest' | 'keyword' | 'behavior';
  matched: boolean;
  fuzzy?: boolean;
  id?: string;
  name?: string;
  category?: string;
  audienceSize?: { lower: number; upper: number };
}

interface TargetingLookupResult {
  platform: Platform;
  available: boolean;
  resolved: ResolvedTarget[];
  reach?: { lower: number; upper: number; band: 'too-narrow' | 'healthy' | 'too-broad' };
  error?: string | null;
}

interface PlatformAdapter {
  isConfigured(): boolean;
  resolve(input: TargetingLookupInput): Promise<TargetingLookupResult>;
}
```

### 7.3 Adapter behaviour

| Adapter | Calls | Notes |
|---|---|---|
| `meta.ts` | `GET /v25.0/search?type=adinterest&q={interest}&limit=10` per interest; then `GET /v25.0/{act}/reachestimate?targeting_spec={geo_locations, flexible_spec:[{interests:[ids]}]}` | Interest search needs no ad account. Reach needs `META_AD_ACCOUNT_ID` and `geo_locations`. Behaviours are looked up with `type=adTargetingCategory&class=behaviors` and matched locally. |
| `pinterest.ts` | `GET /v5/resources/targeting/INTEREST` once; `GET /v5/resources/targeting/KEYWORD` when keywords present | Whole catalog returned; match locally. Access token from `tokenStore` or refreshed via `POST /v5/oauth/token` (`grant_type=refresh_token`); persist the rotated refresh token. |
| `google.ts` | `POST /v25/customers/{id}/googleAds:searchStream` with `SELECT user_interest.user_interest_id, user_interest.name, user_interest.taxonomy_type FROM user_interest WHERE user_interest.name LIKE '%{q}%'` per interest; `topic_constant` similarly | Access token refreshed per invocation (or cached in `tokenStore` for ~50 min). Headers: `developer-token`, `login-customer-id`. Keywords pass through as `matched: false` by design (no catalog on Explorer tier). |
| `tiktok.ts` | `GET /open_api/v1.3/tool/interest_category/?advertiser_id=..&version=2` once; `POST /tool/targeting/search/` for keywords | Header `Access-Token`. Success is `code: 0`. Match the interest tree locally. |

Each adapter wraps its own errors so one platform's failure can never affect the response shape.

### 7.4 Secrets

Set with `supabase secrets set NAME=value` (or the Supabase dashboard). All optional; each adapter reports `isConfigured()` false when its set is incomplete.

| Platform | Secrets |
|---|---|
| Meta | `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` |
| Google | `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID` |
| Pinterest | `PINTEREST_APP_ID`, `PINTEREST_APP_SECRET`, `PINTEREST_REFRESH_TOKEN`, `PINTEREST_AD_ACCOUNT_ID` (optional) |
| TikTok | `TIKTOK_ACCESS_TOKEN`, `TIKTOK_ADVERTISER_ID` |

### 7.5 Token persistence

Pinterest rotates its refresh token on every refresh, and Google access tokens are worth caching across invocations. One table:

```sql
create table platform_tokens (
  platform text primary key,
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  updated_at timestamptz default now()
);
alter table platform_tokens enable row level security;
-- no policies: service-role only
```

The edge function reads and writes it with `SUPABASE_SERVICE_ROLE_KEY`. The `PINTEREST_REFRESH_TOKEN` secret is only the seed; after the first refresh the table is authoritative.

### 7.6 Quotas and caching

- Meta dev tier: 60 points per 5 minutes per ad account, read = 1 point. One analysis costs roughly 1 call per interest + 1 reach call, so about 10 points. Fine for low volume; if the app grows, apply for Full Access or cache interest lookups in a table keyed by normalized query.
- Google Explorer: 2,880 operations/day. Cache the `user_interest` catalog (a few thousand rows) in `platform_tokens`-style storage or a dedicated table with a daily TTL, so steady state is 1 operation/day plus token refreshes.
- Pinterest Trial: 1,000 requests/day. The catalog call returns everything, so cache it with a daily TTL as well.
- TikTok: `interest_category` returns the whole tree; same daily cache.

A `platform_catalog_cache (platform, kind, fetched_at, payload jsonb)` table is the natural follow-up once traffic justifies it; not required for the first version.

### 7.7 Config

`supabase/config.toml`: register `[functions.targeting-options]` with `verify_jwt = false`, matching the existing `analyze-website` function.

## 8. Phased rollout

| Phase | Scope | Gate | Status |
|---|---|---|---|
| 1 | Shared types, matching, bands, edge function skeleton, **Meta** adapter (interest search + reach), **Pinterest** adapter, frontend chips + Verified panel, exports, operator runbook | Meta token in hand (instant); Pinterest Trial approved | **Meta shipped.** Pinterest not started. |
| 2 | **Google Search** keyword enrichment (DataForSEO) + **YouTube** audience catalogs (Google Ads dev token), **TikTok** adapter, catalog cache table | DataForSEO account (free sandbox, instant) or live credentials; Google Ads refresh token minted; TikTok app approved | **Google Search + YouTube built** (PR #3) — awaiting `DATAFORSEO_*`/`GOOGLE_ADS_*` secrets in Lovable to go live. TikTok not started. |
| 3 (optional) | Per-user OAuth so a planner can read their own campaigns' live targeting and performance; live (non-sandbox) DataForSEO/Keyword Planner access | Product decision | Not started. |

Phase 1 is shippable on its own. Phases are additive; no phase changes the response contract.

**Why Google split into two functions instead of one adapter (2026-09-22, decision locked in — see section 0):** the original Phase 2 scope in this table assumed a single `google.ts` adapter would verify both Search keywords and (eventually) YouTube interests against Google Ads' own catalogs. In practice Explorer-tier Google Ads access explicitly excludes Keyword Planner (section 5.4 step 2), so it cannot return keyword search volume, CPC, or competition data — DataForSEO is the only in-scope source for that. Meanwhile YouTube campaigns run inside Google Ads and share the exact audience catalogs (`user_interest` — whose `taxonomy_type` covers AFFINITY/IN_MARKET, used for YouTube/Display, not just Search — with `topic_constant` as a fallback) that a Google Ads adapter would need anyway. So: **DataForSEO → Google Search's `keywords` field** (`enrich-keywords`), **Google Ads dev token → YouTube's `interests`/`behaviors`** (`estimate-youtube-audience`), shipped as two independent, non-blocking functions rather than one. This also retroactively reclassifies YouTube out of the non-goals in section 3 — it's now in scope, for free, off the same credential Google Search... doesn't even need.

**Before either goes live:**
- **Access-tier ceiling.** Explorer tier is enough for YouTube's catalog verification, but real audience *reach estimates* (like Meta's) or live Keyword Planner volume (replacing DataForSEO) both need Google Ads API Standard/Basic access — a longer, non-instant review. Worth applying for in parallel if wanted later; it doesn't block what's shipped now.
- **Shared adapter architecture.** With three enrichment functions now shipped (Meta, DataForSEO, Google Ads/YouTube) sharing the same resolve/match/fail-soft shape, this is the natural point to build the `PlatformAdapter` interface from section 7.1/7.2 instead of continuing to duplicate the pattern per function.
- **`login-customer-id` header.** `estimate-youtube-audience` already sets this when querying through the manager account (section 5.4) — easy to forget if this gets refactored.
- **Quota is per manager account, not per feature.** 2,880 operations/day (Explorer) is shared across YouTube audience verification and anything else built against the same developer token — cache catalog lookups (section 7.6) once traffic exists rather than re-querying per analysis.

---
## 9. Risks and open questions

- **API version sunsets.** Meta Graph versions live ~2 years (v24.0 sunsets Oct 2026); Google Ads API majors ~1 year. Pin versions in one constant per adapter and revisit quarterly.
- **Pinterest refresh-token rotation.** If two invocations refresh concurrently, one new refresh token is lost. Mitigation: refresh only when the cached access token is within 24 hours of expiry, and serialize via a `select ... for update` on the `platform_tokens` row.
- **Google consent screen left in Testing** silently kills the refresh token after 7 days. The runbook makes "In production" a required step.
- **Quota exhaustion** surfaces as `error` in the response, never as a broken report.
- **LLM naming drift.** The LLM may phrase interests in ways the catalogs do not ("outdoor enthusiasts" vs. "Hiking"). The fuzzy match plus the unmatched warning is the intended handling; consider feeding the platform's top suggestions back into the prompt in a later iteration.
- **Lovable AI gateway dependency** for the core analysis is unchanged by this work. Swapping to a direct model API is a separate decision.
- **Open:** exact TikTok scope for `/tool/` endpoints; whether Meta `reachestimate` needs a billing profile. Both resolved by the first real curl.

## 10. Acceptance criteria and verification

Acceptance:

1. With no platform secrets set, the app behaves identically to today apart from one muted "not connected" line on the targeting card for the four supported platforms.
2. With Meta secrets set, a Meta analysis shows per-interest matched/unmatched markers and a reach range with a band note within a few seconds of the main report.
3. With Pinterest secrets set, the same for Pinterest interests (no reach).
4. With Google and TikTok secrets set, the same for their interests (no reach).
5. Any single platform API failure leaves the report intact and shows a one-line error on the card.
6. CSV and clipboard exports include the verification columns when present.

Verification plan:

- Unit tests (Vitest) for `matching.ts`, `bands.ts`, and each adapter's response normalization using recorded fixture JSON. No live calls in tests.
- `deno check supabase/functions/targeting-options/index.ts` passes.
- `npm run build` and `npx vitest run` pass.
- Manual: `supabase functions serve` + curl with a sample body for each platform once secrets exist.
- Manual UI pass for the six acceptance criteria.

## 11. Appendix: sources

Meta: developers.facebook.com/documentation/mcp; developers.facebook.com/blog/post/2026/07/16/meta-ads-mcp-server; developers.meta.com/blog/updates-to-ads-management-standard-access-feature; developers.facebook.com/docs/marketing-api/audiences/guides/reach-estimate; developers.facebook.com/docs/business-management-apis/system-users/install-apps-and-generate-tokens; github.com/facebook/facebook-python-business-sdk.

Google: github.com/googleads/google-ads-mcp; developers.google.com/google-ads/api/docs/api-policy/access-levels; developers.google.com/google-ads/api/docs/api-policy/developer-token; developers.google.com/google-ads/api/docs/get-started/make-first-call; developers.google.com/google-ads/api/rest/auth; github.com/googleads/google-ads-python (google-ads.yaml, generate_user_credentials.py); support.google.com/cloud/answer/15549945 (7-day refresh-token expiry in Testing); ads-developers.googleblog.com/2026/07/accelerate-google-ads-api-basic-access.html.

Pinterest: github.com/pinterest/api-description (OpenAPI 5.28.0); github.com/pinterest/api-quickstart; developers.pinterest.com/docs/key-concepts/access-tiers; developers.pinterest.com/docs/reference/rate-limits; developers.pinterest.com/docs/api/v5/targeting_options-get.

TikTok: github.com/tiktok/tiktok-business-api-sdk (ToolApi, AuthenticationApi, TargetingSearchBody docs); business-api.tiktok.com/portal.

Rejected: mcpbundles.com (ThinkChain Inc aggregator holding third-party OAuth tokens; no platform affiliation or security attestation found).

---

## 12. Branch cleanup note (2026-09-22)

Three branches currently carry unmerged, related work:

- `claude/ad-platform-mcp-research-hflngh` — only this PRD file plus a small README note; already ported into this branch. Safe to delete.
- `claude/seo-meta-social-mcps-rBh3g` — diverged before this PRD existed and before the merged Meta work. Its LinkedIn CSV-upload feature has been ported out (see section 0) and its own Meta function is superseded. `enrich-keywords` (DataForSEO), `enrich-reddit`, and `enrich-tiktok-audience` remain there, not duplicated anywhere else, and are not safe to delete without a decision on porting them (DataForSEO recommended above under Phase 2; Reddit/TikTok deferred). Recommend continuing to port feature-by-feature rather than merging or deleting wholesale, since its Meta code would conflict with and regress the version on `main`.
- `claude/modest-rubin-agqp04` — this branch. Carries the PRD update and the LinkedIn upload port, both pending a PR.
