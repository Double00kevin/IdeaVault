# IdeaVault Roadmap

## Sprint 1 — Foundation (done)
- [x] Project scaffold and repo structure
- [x] Product discovery (/office-hours)
- [x] Architecture review (/plan-eng-review)
- [x] Design review (/plan-design-review)
- [x] Pipeline skeleton with scraper/analysis/push stubs
- [x] Git init + initial commit

## Sprint 2 — Core Pipeline + API + Frontend (current)
- [ ] Reddit scraper (PRAW) + domain-specific subreddits
- [ ] Google Trends scraper (pytrends, optional enrichment)
- [ ] Product Hunt scraper (GraphQL API, date-filtered)
- [ ] Pre-filter top 30 signals by engagement
- [ ] Claude API analysis module (JSON parsing, confidence rubric)
- [ ] D1 schema + migrations
- [ ] Workers API with Hono (ingest webhook HMAC, list, get, health)
- [ ] Dedup in Workers (UNIQUE + fuzzy word-set)
- [ ] Astro + React islands frontend (idea feed, cards, filters)
- [ ] OG image generation per idea
- [ ] systemd timer for daily pipeline run

## Sprint 3 — Auth + Polish
- [ ] User auth (Clerk recommended)
- [ ] Save/rate ideas
- [ ] User dashboard
- [ ] Email digest (Pro tier)
- [ ] Two-stage Claude analysis (classify then analyze)

## Sprint 4 — Monetization + Launch
- [ ] Stripe integration (free/pro tiers)
- [ ] Rate limiting per tier
- [ ] About page, Pro upgrade page, favicon, 404
- [ ] Domain + DNS setup
- [ ] Launch (Product Hunt, Reddit, HN)
