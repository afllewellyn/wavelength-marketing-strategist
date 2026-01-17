# Wavelength Marketing Strategist

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

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
