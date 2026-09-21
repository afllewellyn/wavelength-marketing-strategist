# Fix: Meta audience check fails to run

## What's wrong

The Meta audience size check never reaches the server. The code for it exists in the project, but the function was never activated on the backend — calling it returns "not found", which the app reports as "Failed to send a request to the Edge Function".

Confirmed:
- No logs have ever been recorded for the Meta function.
- A direct test call returns a 404 "function was not found".
- Both Meta credentials (access token and ad account ID) are already stored, so nothing is missing on that side.

## The fix

1. Deploy the Meta audience function so it becomes live on the backend.
2. Run a live test call with a sample interest to confirm it returns real audience numbers rather than an error.
3. Check the function's logs after the test to confirm the Meta credentials work and interests are being matched.
4. If Meta rejects the credentials (expired token or wrong ad account), report exactly what Meta says and what you need to update — no guessing.

## Also improve the error message

Right now a failure shows a generic technical message. Change the Meta panel's failure text to something actionable, e.g. "Audience size check is unavailable right now — the rest of the report is unaffected." The main report keeps rendering either way.

## Technical notes

- `supabase/functions/estimate-meta-reach/index.ts` exists and `supabase/config.toml` already has its `verify_jwt = false` block; it simply needs deployment.
- Verification via a direct function call plus function logs.
- Frontend change limited to the error string surfaced from `src/lib/api/analysis.ts` / `TargetingStrategyCard.tsx`.
