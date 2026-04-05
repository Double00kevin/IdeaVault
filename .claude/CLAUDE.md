# AIdeaPulse — Project Rules

## Overview

AIdeaPulse is an AI-powered startup idea discovery SaaS platform. crawlee-research scrapes demand signals from 14 sources, Claude Code analyzes them directly (no Anthropic API), and structured idea briefs are served through a web app with free/pro monetization tiers.

- **Last updated:** 2026-04-05
- **Status:** Anthropic API removed. Analysis now handled by Claude Code on KITT reading crawlee-research exports and writing to D1 via MCP. Pipeline decommissioned. 201+ ideas in production. Pro pricing $25/mo. Launch posts still pending.

## Architecture

| Component          | Technology                        | Where      |
|--------------------|-----------------------------------|------------|
| Signal scraping    | crawlee-research (TypeScript)     | KITT       |
| AI analysis        | Claude Code (manual trigger)      | KITT       |
| D1 writes          | Cloudflare MCP tool               | KITT       |
| API/backend        | Cloudflare Workers (TypeScript)   | Cloudflare |
| Database           | Cloudflare D1 (SQLite + FTS5)     | Cloudflare |
| Rate limiting      | Durable Objects (atomic counters) | Cloudflare |
| Frontend           | Astro + React islands + Tailwind  | CF Pages   |
| Object storage     | Cloudflare R2                     | Cloudflare |
| Auth               | Clerk (prod keys, global window.Clerk) | CF Workers |
| Payments           | Stripe                            | CF Workers |

## Analyze Crawlee Exports

When Kevin says "analyze crawlee exports", follow this workflow. Process one source at a time.

### 1. Read latest exports

Exports live at `~/crawlee-research/storage/exports/`. Files are named `{source}-{ISO-timestamp}.json`. For each source prefix, read only the most recent file (sort by timestamp in filename).

### 2. Source mapping

| Export prefix | D1 source_type | Pre-filter: keep top N by |
|---|---|---|
| reddit | reddit | 20 by (score + numComments) |
| hackernews | hackernews | 15 by points (Ask/Show HN boosted 2x) |
| producthunt | producthunt | 5 by votesCount |
| github-trending | github_trending | 10 by stars |
| github-search | github_trending | 10 by stars |
| github-issues | github_issues | 15 by reactions |
| devto | devto | 10 by (reactions + comments) |
| lobsters | lobsters | 10 by score |
| newsapi | newsapi | 10 as-is |
| stackexchange | stackexchange | 15 by score (unanswered boosted 2x) |
| discourse | discourse | 15 by (likes + replies) |
| packagetrends | package_trends | 15 by downloadsRecent |

Skip: youtube, linkedin-jobs, news, github-readme.

### 3. Deduplicate against existing ideas

Before analyzing, query D1 for all existing `title_normalized` values:

```sql
SELECT title_normalized FROM ideas
```

For each signal, normalize its title (lowercase, trim, collapse whitespace) and check Jaccard word-set similarity against all existing titles. If similarity > 0.85, skip it.

Jaccard similarity = |intersection of word sets| / |union of word sets|.

### 4. Classify each signal

For each pre-filtered signal, decide: does this represent a real startup demand signal?

**Pass** signals that reveal: unmet needs, complaints about existing tools, requests for solutions, emerging markets, or high-engagement discussions about building something.

**Skip** signals that are: generic news, self-promotion, tutorials without pain points, memes, already-solved problems, or too vague to extract a startup idea from.

Target ~40-60% pass rate. Be selective.

### 5. Analyze passing signals

For each passing signal, produce a structured idea with ALL of these fields:

- **title**: Short idea title (under 60 chars)
- **product_name**: Creative, memorable product name
- **one_liner**: One sentence pitch
- **problem_statement**: What specific problem does this solve?
- **target_audience**: Who specifically is this for?
- **market_size**: `{"tam": "$X", "sam": "$X", "som": "$X"}` with dollar amounts
- **competitors**: Array of specific competitor names
- **build_complexity**: "low", "medium", or "high"
- **build_timeline**: Estimated time to MVP (e.g., "2 weekends", "1 month")
- **monetization_angle**: How to make money (specific pricing)
- **scores**: Each 0-100:
  - **opportunity**: Market size clarity + competitive gap. Large clear market with few funded competitors = high.
  - **pain_level**: Signal engagement strength + problem urgency. High upvotes/comments = high.
  - **builder_confidence**: Technical feasibility + timeline realism. Simple stack, clear MVP scope = high.
  - **timing**: Trend velocity + market readiness. Rising volume, regulatory changes, new tech enablers = high.
- **confidence_score**: opportunity×0.30 + pain_level×0.25 + builder_confidence×0.25 + timing×0.20
- **narrative_writeup**: 3-4 paragraphs: (1) the problem and why it exists now, (2) what the product does, (3) how to validate it, (4) monetization and growth path. Use product_name. Direct, practical language.
- **validation_playbook**: 3-5 concrete, actionable steps (e.g., "Post in r/freelance asking about this pain point")
- **gtm_strategy**: Specific channels, pricing strategy, partnerships, how to get first 100 paying customers
- **source_links**: Array of URLs from the original signal
- **community_signals**: Array of objects with raw signal data that inspired this idea

### 6. Framework analysis

For ideas with confidence_score >= 30, produce 4 framework evaluations:

```json
[
  {"label": "Is this worth building?", "framework": "Value Equation", "score": 0-10, "explanation": "2-3 sentences"},
  {"label": "Who would pay and why?", "framework": "ACP", "score": 0-10, "explanation": "2-3 sentences"},
  {"label": "How does this stack up?", "framework": "Value Matrix", "score": 0-10, "explanation": "2-3 sentences"},
  {"label": "Where's the money?", "framework": "Value Ladder", "score": 0-10, "explanation": "2-3 sentences"}
]
```

Score rubric: 8-10 = strong signal, clear path. 5-7 = mixed, needs validation. 1-4 = weak, significant concerns.

### 7. Write to D1

Use the `mcp__claude_ai_Cloudflare_Developer_Platform__d1_database_query` MCP tool.

D1 database: `ideavault` (ID: `006d427e-0833-4a94-9453-b6730b4a087c`)

For each analyzed idea, run:

```sql
INSERT OR IGNORE INTO ideas
  (id, title, title_normalized, one_liner, problem_statement,
   target_audience, market_size_json, competitors_json, competitor_count,
   build_complexity, build_timeline, monetization_angle,
   confidence_score, source_links_json, source_type,
   narrative_writeup, product_name, validation_playbook, gtm_strategy,
   scores_json, community_signals_json, frameworks_json)
VALUES
  ('{uuid}', '{title}', '{normalized_title}', '{one_liner}', '{problem_statement}',
   '{target_audience}', '{market_size_json}', '{competitors_json}', {competitor_count},
   '{build_complexity}', '{build_timeline}', '{monetization_angle}',
   {confidence_score}, '{source_links_json}', '{source_type}',
   '{narrative_writeup}', '{product_name}', '{validation_playbook}', '{gtm_strategy}',
   '{scores_json}', '{community_signals_json}', '{frameworks_json}')
```

- Generate a UUID v4 for `id`
- `title_normalized` = lowercase, trimmed, whitespace-collapsed version of title
- All JSON fields (market_size, competitors, source_links, scores, community_signals, frameworks) must be JSON-stringified strings
- `frameworks_json` is the JSON array from step 6, or `{}` if confidence < 30

### 8. Report results

After all sources are processed, print a summary:
- Signals read per source
- Signals after pre-filter
- Signals that passed classification
- Ideas written to D1
- Duplicates skipped

## Key References

- `docs/changelog.md` — timestamped record of every change
- `docs/roadmap.md` — feature roadmap (check off items as they ship)
- `decisions/` — architecture decision records (ADRs)

## Repo Structure

```
AIdeaPulse/
├── .claude/
│   ├── CLAUDE.md
│   ├── rules/
│   └── settings.local.json
├── decisions/          # ADRs (root-level)
├── docs/
│   ├── changelog.md
│   ├── roadmap.md
│   ├── OPEN_ITEMS.md
│   ├── decisions/      # additional decision docs
│   ├── images/
│   ├── specs/
│   └── testing-results/
├── frontend/           # Astro + React + Tailwind
├── workers/            # Cloudflare Workers (TypeScript)
├── README.md
└── TODOS.md
```

## Security (non-negotiable)

- No secrets in repo — all API keys via env vars
- Input validation on all API endpoints
- Rate limiting at Cloudflare edge

## Code Conventions

### TypeScript (workers/, frontend/)
- Strict mode, eslint
- Wrangler for Workers dev/deploy

### Git
- Conventional commits: feat:, fix:, chore:, docs:
- Every change logged in docs/changelog.md
- Security changes noted separately
- Significant architecture decisions logged in docs/decisions/ as ADRs

## Close The Loop Protocol

When asked to "close the loop":
1. `git log -1 --oneline` to get latest commit.
2. Update "Last updated" date in this file.
3. Append summary to `docs/changelog.md` with commit hash.
4. Verify matching roadmap item is checked off in `docs/roadmap.md`.
5. Verify `README.md` reflects current capabilities — update if stale.
6. Full change audit:
   a. Grep entire repo for key terms from the change (old values, prices, feature names, version numbers). Every hit is either updated or confirmed historical. Report the sweep results.
   b. Check ALL docs/ files for staleness — OPEN_ITEMS.md, specs, ADRs, decisions/, any doc that could reference what changed.
   c. Check external systems affected by the change (Stripe prices/products, Wrangler secrets, DNS, Clerk config, GitHub Actions workflows). Confirm each is current.
   d. Check ~/.claude/projects/ memory files for stale references. Update or remove outdated entries.
   e. Report what was checked and what was updated — nothing is assumed clean without verification.
7. Stage, commit (`docs: close the loop for [hash]`), and push.

## Skill routing

When the user's request matches an available skill, ALWAYS invoke it using the Skill
tool as your FIRST action. Do NOT answer directly, do NOT use other tools first.
The skill has specialized workflows that produce better results than ad-hoc answers.

Key routing rules:
- Product ideas, "is this worth building", brainstorming → invoke office-hours
- Bugs, errors, "why is this broken", 500 errors → invoke investigate
- Ship, deploy, push, create PR → invoke ship
- QA, test the site, find bugs → invoke qa
- Code review, check my diff → invoke review
- Update docs after shipping → invoke document-release
- Weekly retro → invoke retro
- Design system, brand → invoke design-consultation
- Visual audit, design polish → invoke design-review
- Architecture review → invoke plan-eng-review
