# Add Google Display Network as a platform

## Goal
Pick "Google Display" in the form and get a Display-specific report: audiences checked against real Google Ads catalogs, plus Responsive Display Ad copy.

## What you'll see
- A new **Google Display** option in the platform list.
- **Targeting**: In-Market audiences, Affinity audiences, content topics, and placement/keyword themes. No Reddit, LinkedIn or Meta fields.
- **Audience check**: each audience and topic is checked against Google Ads (the same check YouTube uses). Matches get a green mark, unmatched ones get the amber warning.
- **Ad copy (Responsive Display Ads)** for each audience segment: 5 short headlines (30 characters max), 1 long headline (90 max), 5 descriptions (90 max), and the business name. Each line shows its character count.
- **Exports**: "Copy" and "Download CSV" include the Display audiences and ad copy.

## What stays the same
- No new Google credentials are needed. It uses the same connection as YouTube.
- No budget suggestions. Success signals stay focused on business outcomes.
- Other platforms don't change. If the audience check fails, the report still loads with the "unavailable" note.

## Steps
1. Add the platform option and its loading message.
2. Teach the strategist the Display rules: which audiences and topics to suggest, the RDA format and strict character limits.
3. Run the existing Google Ads audience check for Display too.
4. Add a Display ad copy card with character counts.
5. Add Display content to clipboard and CSV export.
6. Test: live check of the audience step, then a full Display report in the preview, then check copy and CSV.
7. Update the roadmap and project notes.

## Technical notes
- `Platform` gets `'google_display'`. New `DisplayAdGroup { audienceSegment, shortHeadlines[5], longHeadline, descriptions[5], businessName, testingNotes }` on `AnalysisResult.displayAdCopy`.
- analyze-website: add a Display branch to the prompt and schema. Trim anything over a limit on the server, the same way RSA copy is handled.
- src/lib/api/analysis.ts: send `youtube` and `google_display` through `estimateYoutubeAudience`. Store the result in `youtubeAudience` (rename the label in the UI to "Google Ads audience").
- New `DisplayAdCopyCard.tsx`. ResultsSection picks between search, display and social cards.
- Add Display to formatters.ts and csv.ts. Add a vitest for the character-limit trimming.
- Redeploy analyze-website only. The estimate function doesn't change.
