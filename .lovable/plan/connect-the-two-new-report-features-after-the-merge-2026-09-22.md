# Connect the two new report features after the merge

## What I found

The merged code is complete on the app side — keyword demand (Google) and YouTube audience checks are typed, rendered in the Targeting card, and included in both the copy-to-clipboard text and the CSV export.

Two things are not connected:

1. **Neither new backend function is live.** Calling each one directly returns "function was not found". So on a Google report the keyword demand panel shows "unavailable", and the same for YouTube.
2. **YouTube has no Google Ads credentials stored.** Even once live, the YouTube check needs six Google Ads values that aren't saved yet, so it would report itself as unavailable.

Keyword demand does have credentials saved, and is currently pointed at the provider's free test environment — it will return realistic-looking sample numbers, not live data, until switched over.

## Plan

1. Publish `enrich-keywords` and `estimate-youtube-audience` so the app can reach them.
2. Run a live test of each and read the response, confirming the report panels fill in rather than showing "unavailable".
3. Ask you for the Google Ads credentials the YouTube check needs (developer token, client ID, client secret, refresh token, customer ID, login customer ID). Until they're supplied, YouTube reports will keep showing a polite "unavailable" note and nothing else breaks.
4. Confirm with you whether keyword demand should stay on the free test data or switch to live billed data.

## Technical notes

- Deploy via `supabase--deploy_edge_functions` for both function names; both already have `verify_jwt = false` blocks in `supabase/config.toml`.
- Secrets present: `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, `DATAFORSEO_BASE`, `META_*`. Missing: `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`.
- Client wiring verified in `src/lib/api/analysis.ts` (platform-gated calls), `src/types/analysis.ts`, `TargetingStrategyCard.tsx`, `formatters.ts`, `csv.ts` — no code changes needed there.
- Switching keyword data to live means setting `DATAFORSEO_BASE` to `https://api.dataforseo.com` (consumes credits per lookup).
