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
- **Real data checks**: when live data is available, the app adds real search demand (Google), audience sizes (Meta), and audience matches (YouTube) to the plan.
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

## How it works

1. You enter a website and a short product description in the page.
2. The page sends them to the backend (Supabase Edge Functions).
3. The backend reads the website, then an AI model writes the strategy.
4. Helper functions check the plan against real ad data, like how many people search for a keyword.
5. The page shows the strategy and the real numbers side by side.

## Configuration

The page talks to Supabase. Set these two variables for the frontend (Vite):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Each backend function needs its own secrets. Save them in your Supabase (or Lovable) project settings. Never commit secrets to the repo.

| Function | What it does | Secrets |
| --- | --- | --- |
| `analyze-website` | Reads the website and writes the strategy with AI | `FIRECRAWL_API_KEY`, `LOVABLE_API_KEY` |
| `enrich-keywords` | Gets real Google search demand for keywords | `DATAFORSEO_LOGIN`, `DATAFORSEO_PASSWORD`, optional `DATAFORSEO_BASE` |
| `estimate-meta-reach` | Checks Meta interests and audience size | `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` |
| `estimate-youtube-audience` | Matches your audience ideas to real YouTube audiences and topics | `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, optional `GOOGLE_ADS_LOGIN_CUSTOMER_ID`, optional `GOOGLE_ADS_DEVELOPER_TOKEN` |

## What technologies are used for this project?

**App**

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- React Router (page navigation)
- TanStack Query (loads data from the backend)
- Recharts (charts)
- xlsx (spreadsheet export)
- Vitest (tests)

**Backend**

- Supabase Edge Functions (small server programs written for Deno)

**APIs**

- **Firecrawl**: reads and scrapes the product website.
- **Lovable AI Gateway**: the AI that analyzes the site and writes the strategy and ad copy.
- **DataForSEO**: real Google keyword search demand.
- **Meta Marketing API**: real Meta interests and audience sizes.
- **Google Ads API**: real YouTube audience and topic names. It signs in with OAuth (a secure login), not an API key.

## Tests and checks

```sh
npm run test    # run the tests
npm run lint    # check code style
npm run build   # make sure the app builds
```
