# Wavelength Marketing Strategist

## What this tool is

Wavelength Marketing Strategist is a web app that turns a product website plus a short product brief into a paid-acquisition strategy. It scrapes the site, analyzes positioning, and generates ICPs, targeting guidance, and platform-native ad copy.

## What you can do with it

- Analyze a product’s positioning and buyer awareness.
- Define primary, secondary, and “avoid” customer profiles.
- Get platform-specific targeting recommendations.
- Generate ad copy or Google Search Ad assets tailored to a chosen platform.
- Iterate quickly by changing the platform or brand voice.

## What goes in

The app asks for:

- Website URL
- Product description
- Primary ad platform (Meta, TikTok, YouTube, Reddit, LinkedIn, or Google)
- Optional brand voice guidelines

## What comes out

The analysis returns structured results:

- **Website analysis**: value proposition, problem solved, target customer, industry, pricing signals, awareness level, confidence, and assumptions.
- **ICPs**: primary, secondary, and avoid segments with demographics, psychographics, pain points, and rationale.
- **Targeting strategy**: platform-specific audiences, interests/behaviors, placements, exclusions, funnel stage, and budget guidance.
- **Ad copy**:
  - Social platforms: multiple ad variations with hooks, headlines, and CTAs.
  - Google Search: headline/description assets with character counts and keyword alignment.
- **Optional**: scraped content reference used to inform the analysis.

## How can I edit this code?

Clone the repo locally and run the dev server.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## Configuration

The frontend uses Supabase for the `analyze-website` Edge Function. Set these variables:

**Frontend (Vite)**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

**Supabase Edge Function**

- `FIRECRAWL_API_KEY` (for website scraping)
- `LOVABLE_API_KEY` (for AI analysis)

## Real-data enrichment (optional, sandbox-friendly)

After the base AI analysis, the app layers in **real platform data** so recommendations are
grounded — keyword demand, audience size, community reach, and interest validation. Every layer is
**read-only / sandbox-first**: this is a planning tool and never launches campaigns or pushes
creative. Enrichment fails soft — if a layer's credentials are missing or rate-limited, the core
report still renders and a quiet status badge is shown.

Each layer is its own Supabase Edge Function and is gated by the chosen platform:

| Platform | Function | What it adds | Edge Function secrets |
|---|---|---|---|
| Google | `enrich-keywords` | Search volume, CPC, competition per keyword (Google Keyword Planner data via DataForSEO) | `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, optional `DATAFORSEO_BASE` |
| Meta | `estimate-meta-reach` | Audience-size reach estimate + interest validation | `META_ACCESS_TOKEN` (`ads_read`), `META_AD_ACCOUNT_ID` |
| Reddit | `enrich-reddit` | Real subscriber counts for suggested subreddits | optional `REDDIT_ACCESS_TOKEN` |
| TikTok | `enrich-tiktok-audience` | Validates interests against TikTok's interest-category taxonomy | `TIKTOK_ACCESS_TOKEN`, `TIKTOK_ADVERTISER_ID`, optional `TIKTOK_BASE` |

**Sandbox notes**

- **DataForSEO** defaults to the free Sandbox (`https://sandbox.dataforseo.com`) — structurally
  identical mock data, no credits consumed. Set `DATAFORSEO_BASE=https://api.dataforseo.com` to go
  live.
- **Meta**: use a Sandbox ad account (`act_…`) — the API works but never delivers ads or spends.
  Swap in a real read-only (`ads_read`) token for true live estimates.
- **Reddit**: no token needed for public subreddit sizes; set `REDDIT_ACCESS_TOKEN` (read scope) to
  use the authenticated endpoint.
- **TikTok**: use a Sandbox advertiser ID + token (no app review required).

### LinkedIn job-title grounding (no API needed)

LinkedIn's standardized title taxonomy is gated behind Marketing-Developer-Platform partner
approval, so instead the LinkedIn flow lets you **upload your own job-title list** (`.xlsx` / `.csv`,
parsed entirely in the browser — the file never leaves the device). The AI then grounds its
`jobTitles` suggestions to titles that actually appear in your list. A starter file is included at
[`public/sample-linkedin-job-titles.csv`](public/sample-linkedin-job-titles.csv) (LinkedIn's public
26-function / 7-seniority taxonomy); extend it, or use a Sales Navigator export or a compiled sheet.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- Supabase (Edge Functions)

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
