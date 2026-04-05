# AIdeaPulse

AI-powered startup idea discovery platform. crawlee-research scrapes demand signals from 14 sources, Claude Code analyzes them directly on KITT (no Anthropic API), and structured idea briefs are served through a web app.

## Status

Anthropic API removed. Analysis now handled by Claude Code on KITT reading crawlee-research exports and writing to D1 via MCP. 201+ ideas in production. Pro tier at $25/mo. Launch pending.

**Live:** https://aideapulse.com | API: https://api.aideapulse.com | Trends: https://aideapulse.com/trends

**What's built:** 14-source crawlee-research scraping → Claude Code analysis (classify → analyze → frameworks) → D1 storage with FTS5 full-text search → dark-theme Astro frontend. Clerk auth, Stripe Pro subscriptions, Durable Object rate limiting. Framework Analysis (4 scored business frameworks per idea). Smart Match, rich narratives, community signals, trends dashboard, data export, OG images.

## Architecture

```
KITT                                            Cloudflare
┌───────────────────────────┐                  ┌──────────────────────────┐
│  crawlee-research         │                  │  Hono Worker             │
│  ├─ 14 crawlers (cron)   │                  │    ├─ GET /api/ideas     │
│  └─ storage/exports/*.json│                  │    ├─ GET /api/trends    │
│         │                 │                  │    ├─ GET /api/search    │
│  Claude Code (manual)     │  D1 MCP          │    └─ GET /api/health    │
│  ├─ Read exports          │  ──────────────► │         │                │
│  ├─ Classify signals      │                  │         ▼                │
│  ├─ Analyze → IdeaBrief  │                  │  D1 (ideas + FTS5)       │
│  ├─ Framework scoring     │                  │  Durable Objects (rate)   │
│  └─ Write to D1 via MCP  │                  │                          │
│                           │                  │  CF Pages (Astro)        │
│                           │                  │    ├─ / (landing + feed) │
│                           │                  │    ├─ /trends            │
│                           │                  │    └─ /ideas/:id         │
└───────────────────────────┘                  └──────────────────────────┘
```

- **crawlee-research** scrapes 14 sources (Reddit, HN, PH, GitHub Trending/Search/Issues, Dev.to, Lobste.rs, NewsAPI, Stack Exchange, Discourse Forums, PyPI/npm, RSS feeds) on KITT via cron
- **Claude Code** reads crawlee exports, classifies signals, produces structured idea briefs, writes directly to D1 via Cloudflare MCP tool. Manual trigger.
- **Cloudflare Workers** (Hono) API with cursor-paginated list, fuzzy dedup, trends API, Pro export API
- **Cloudflare D1** stores ideas (22 columns), keyword trends, user profiles, subscriptions, saved ideas
- **Astro + React islands + Tailwind** dark-theme frontend with marketing landing page, constellation hero, data-forward card design, filters, a11y
- **Trends Dashboard** at /trends — keyword trends with volume, growth %, searchable grid, Pro-gated time-series charts
- **OG images** auto-generated per idea for social sharing
- **Clerk auth** with JWT verification in Workers, save/rate ideas
- **Stripe** Pro subscriptions with checkout sessions + webhook lifecycle
- **Framework Analysis** 4 plain-language business framework scores per idea
- **Email digests** via Resend with user frequency preferences
- **Smart Match** personalized idea scoring for Pro users (skill/niche/budget/complexity fit)
- **Content gating** three-tier visibility — anon sees titles (SEO), free gets 1 full idea/day + product name teaser, Pro sees full analysis/frameworks
- **Data Export** Pro-only JSON download of all or saved ideas
- **GitHub Actions CI/CD** auto-deploys frontend to CF Pages on push to main

## Project Structure

```
AIdeaPulse/
  workers/             # Cloudflare Workers API (Hono + TypeScript)
    src/routes/        # ideas, trends, export, profile, search, health, og endpoints
    src/scoring/       # fitScore engine + unit tests
    src/               # rate-limiter-do.ts (Durable Object for atomic rate limiting)
    migrations/        # D1 SQL schema (13 migrations including FTS5)
    test/              # vitest + miniflare tests
  frontend/            # Astro + React islands + Tailwind (CF Pages)
    src/components/    # IdeaCard, IdeaFeed, FrameworkAnalysis, ScoreBreakdown, CommunitySignals, TrendsDashboard, TrendChart, SaveButton, ProfileSetup, ProCheckout, HeaderAuth
    src/pages/         # index, /ideas/[id], /dashboard, /trends, /pro, /about, 404
    src/layouts/       # BaseLayout with SEO meta tags
  docs/                # Changelog, roadmap, open items
  decisions/           # Architecture decision records
```

## Development

### Workers (TypeScript)
```bash
cd workers
npm install          # already done
npx vitest run       # run tests (23 tests)
npx wrangler dev     # local dev
npx wrangler deploy  # deploy to Cloudflare
```

### Frontend (Astro)
```bash
cd frontend
npm install                    # already done
npm run dev  # uses PUBLIC_API_URL from .env
```

## Security

- All secrets via environment variables (`.env` gitignored)
- Fuzzy dedup prevents duplicate ideas (word-set Jaccard similarity)
- See `.claude/CLAUDE.md` for full security policy
