# Turn on the YouTube audience check

## Goal
YouTube reports should show real Google Ads interest and topic matches instead of the "unavailable" note.

## Why it fails today
The live version of the YouTube check is older than the code in the project. It still requires the developer token, which you don't have and no longer need. The project code already treats that token as optional, but that version was never published.

## Steps
1. **Republish the YouTube check** from the current project code, with the developer token optional. The commit that names missing secrets in errors (e0f45f2) stays out of this.
2. **Run a live test** with sample interests ("Biotechnology", "Laboratory equipment") and a behavior ("Science professionals"), then read the response and the function logs.
3. **Work out what any failure means**:
   - Sign-in error: the refresh token or client ID/secret is wrong or expired. You'd create a new refresh token.
   - Permission or "customer not enabled" error: the customer ID is wrong, or a manager account ID is needed.
   - Success with no matches: your Google Cloud project only has Test access, which can't reach real accounts. You'd apply for Explorer access.
4. **Check the full flow in the preview**: run a YouTube analysis and confirm the audience panel shows matched names and categories, and that copy and CSV export include them.
5. **Update the roadmap**: close the YouTube item, or mark what it's still waiting on.

## What stays the same
- Meta, Google keyword demand and the rest of the report don't change.
- If the YouTube check fails, the report still shows the polite "unavailable" note.

## Technical notes
- Deploy only `estimate-youtube-audience`, using `readCredentials()`, which requires only CLIENT_ID, CLIENT_SECRET, REFRESH_TOKEN and CUSTOMER_ID.
- Test with `supabase--curl_edge_functions` POST `/estimate-youtube-audience`, then run `supabase--edge_function_logs`.
- API version v25. If it returns 404 for an unsupported version, set the newest supported version and redeploy.
- QA script: run `/tmp/browser/qa/qa_run.py` with PLATFORM=youtube.
