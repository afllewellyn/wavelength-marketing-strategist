
## Goal

Strengthen the report with two new data layers:
1. **Semrush** enriches every Google Search Ad target keyword with real search volume, CPC, competition, and difficulty.
2. **Meta Marketing API** validates the targeting strategy's interests/behaviors with a real reach estimate before users launch.

Both run server-side from the existing `analyze-website` flow (or sibling edge functions) so no API keys ship to the browser.

---

## Part 1 — Semrush enrichment for Google Search keywords

### Connector setup
- Use the existing **Semrush connector** via the Lovable connector gateway (no key management needed; OAuth handled by gateway).
- Trigger `standard_connectors--connect` for `semrush` during the build so the user authorizes their account. The user is told upfront: existing Semrush subscription limits apply; new accounts get the free plan's daily caps.

### New edge function: `enrich-keywords`
- Input: `{ keywords: string[], database: 'us' | 'uk' | ... }`
- For each keyword (batched, max ~10 to respect quota), call gateway:
  `GET /semrush/keywords/phrase_this?phrase=<kw>&database=us&export_columns=Ph,Nq,Cp,Co,Kd`
  - `Nq` = monthly volume, `Cp` = CPC, `Co` = competition, `Kd` = keyword difficulty
- Handles the `ERROR 134 :: TOTAL LIMIT EXCEEDED` response with a clear user-facing message.
- Returns `{ keyword, volume, cpc, competition, difficulty }[]`.

### Wiring into the analysis flow
- After `analyze-website` produces `searchAdCopy`, the frontend calls `enrich-keywords` with the union of `targetKeywords` across ad groups.
- Result is merged into each `SearchAdHeadline`/group via a new `keywordMetrics` map on `AnalysisResult`.

### UI changes
- `SearchAdCopyCard.tsx`: under each ad group, add a small **Keyword Demand** table — keyword, volume, CPC, KD (color-coded band: <30 green, 30–50 amber, 50+ red), competition.
- Loading skeleton while enrichment resolves so the rest of the report renders immediately.
- Empty/error state when Semrush quota is hit: "Semrush quota exhausted — keyword metrics unavailable."

### Types
- Extend `src/types/analysis.ts`:
  ```ts
  interface KeywordMetric {
    keyword: string;
    volume: number | null;
    cpc: number | null;
    competition: number | null;
    difficulty: number | null;
  }
  // AnalysisResult: keywordMetrics?: KeywordMetric[]
  ```
- Update `src/lib/export/csv.ts` and `formatters.ts` so the new metrics flow into CSV + clipboard exports.

---

## Part 2 — Meta audience size validation

> Note: there is **no official Meta MCP connector** in the Lovable catalog. We'll integrate the Meta Marketing API directly via a long-lived access token the user provides once.

### Secrets
- Request via `add_secret`:
  - `META_ACCESS_TOKEN` — System User token with `ads_read` scope
  - `META_AD_ACCOUNT_ID` — e.g. `act_1234567890`
- Walk the user through generating these in Meta Business Manager → System Users → Generate Token before requesting them.

### New edge function: `estimate-meta-reach`
- Input: `{ interests: string[], behaviors: string[], geoLocations?: { countries: string[] } }`
- Two-step Meta API flow:
  1. `GET /v21.0/search?type=adinterest&q=<interest>` to resolve each interest name → `{id, audience_size_lower_bound, audience_size_upper_bound}`.
  2. `GET /v21.0/<ad_account_id>/reachestimate?targeting_spec={...}` with the resolved interest IDs + default geo (US if unspecified).
- Returns:
  ```ts
  {
    resolvedInterests: { name, id, matched: boolean }[],
    audienceSize: { lower: number, upper: number },
    suggestion: 'too-narrow' | 'healthy' | 'too-broad'
  }
  ```
- Band logic: <50k = too-narrow, 50k–10M = healthy, >10M = too-broad.

### Wiring
- Only fires when `platform === 'meta'`.
- Frontend calls `estimate-meta-reach` after the main analysis completes (parallel with Semrush enrichment).
- Unresolved interests (Meta has no match) are flagged so users know to swap them.

### UI changes
- `TargetingStrategyCard.tsx` (Meta only): add **Estimated Audience Reach** panel showing the range + a contextual note ("This audience is in a healthy size range for Meta cold prospecting").
- Inline pill on each interest chip: ✓ matched in Meta library, or ⚠ no match found.

### Types
- Extend `TargetingStrategy` with optional `metaReachEstimate?: { lower, upper, suggestion, resolvedInterests }`.

---

## Part 3 — Cross-cutting

- **Export updates**: CSV + clipboard formatters include the new Semrush metrics and Meta reach data when present.
- **Error isolation**: enrichment failures never block the core report — they degrade gracefully with status badges.
- **Caching**: in-memory dedupe within a single edge function invocation (keyword strings, interest names) to minimize quota burn.
- **Rate limit awareness**: surface Semrush 403 and Meta `error.code 17/4` (rate limit) as friendly toasts in the UI.

### Files touched
- New: `supabase/functions/enrich-keywords/index.ts`, `supabase/functions/estimate-meta-reach/index.ts`
- Edited: `src/types/analysis.ts`, `src/lib/api/analysis.ts` (orchestration), `src/components/wavelength/SearchAdCopyCard.tsx`, `src/components/wavelength/TargetingStrategyCard.tsx`, `src/components/wavelength/ResultsSection.tsx`, `src/lib/export/formatters.ts`, `src/lib/export/csv.ts`

### Connector / secret prerequisites
1. `standard_connectors--connect` for `semrush` (you'll authorize in a popup)
2. `add_secret` for `META_ACCESS_TOKEN` + `META_AD_ACCOUNT_ID` (guided)

### Out of scope (flag for later)
- Semrush competitor SERP view, related-keyword suggestions
- Meta campaign performance benchmarking (requires deeper OAuth + per-user accounts)
- Persisting enrichment results between runs (would require a DB table)
