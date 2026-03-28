# AIdeaPulse — Homepage Redesign Spec
**Date:** 2026-03-27
**Author:** Kevin (via Cowork planning session)
**Design References:** Linear (linear.app), OrbitAI (awwwards nominee), June (june.so), Fey (feyapp.com)

---

## Design Direction

**Theme:** Dark mode, modern AI SaaS aesthetic
**Vibe:** Linear meets OrbitAI — clean dark backgrounds, high-contrast typography, subtle 3D/orbital visual in hero, glassmorphism accents on cards
**Color palette:** Dark navy/near-black background (#0a0a0f or similar), white primary text, muted gray secondary text, teal/cyan accent (#06b6d4 or similar) for CTAs and highlights, subtle gradient glows behind key elements
**Typography:** Large, bold sans-serif headlines (Inter or similar). Big visual hierarchy — hero headline should be 48-64px on desktop.

---

## Page Structure (Section by Section)

### 1. Navigation Bar (sticky)
- Logo: "AIdeaPulse" with a subtle pulse/signal icon
- Links: Features | Pricing | About
- Right side: Sign In (ghost button) | Get Started Free (solid teal CTA)
- Dark background, minimal, no border — just a subtle bottom fade

### 2. Hero Section
- **Background:** Dark with a subtle animated 3D network/constellation visualization — nodes connected by lines, gently rotating. Represents the 8 data sources being scanned across the web. CSS/SVG animation preferred over Three.js for performance (Astro site, keep it light). A soft radial gradient glow (teal/purple) behind the center.
- **Headline (centered, large):** "AI-Powered Startup Ideas. Delivered Daily."
- **Subtitle (centered, muted gray):** "We scan Reddit, Hacker News, Product Hunt, and 5 more sources every morning. Claude AI analyzes the signals. You get validated ideas before anyone else."
- **Dual CTA buttons (centered):**
  - Primary (solid teal): "Get Started Free →"
  - Secondary (ghost/outline): "See Today's Ideas"
- **Trust line below buttons (small, muted):** "No credit card required · 50 free ideas per day"
- **Below CTAs:** A product screenshot/mockup showing the idea feed with 2-3 idea cards visible. The screenshot should have a subtle shadow/glow and slight perspective tilt (CSS transform) to give depth. Use the actual live product — screenshot the feed with real ideas.

### 3. Source Logo Strip
- **Label (small, centered, muted):** "Scanning 8 sources every morning"
- **Logos in a row (grayscale, subtle):** Reddit · Hacker News · Product Hunt · GitHub · Dev.to · Lobste.rs · Google Trends · NewsAPI
- Use recognizable icons/wordmarks. Grayscale with slight opacity, subtle hover to full color.
- This section acts as instant credibility — the user sees real, known platforms.

### 4. How It Works (3-Column)
- **Section headline (centered):** "From noise to signal in three steps"
- Three columns, each with:
  - A minimal isometric/wireframe illustration (Linear-style) or icon
  - Bold label
  - 1-2 line description

| Column | Label | Description |
|--------|-------|-------------|
| 1 | **Scrape** | "Every morning at 6am UTC, our pipeline pulls the top trending discussions, launches, and repos from 8 platforms." |
| 2 | **Analyze** | "Two-stage Claude AI analysis scores each signal for market demand, feasibility, and competitive landscape." |
| 3 | **Deliver** | "Browse curated idea briefs in your feed, or get a daily email digest with the best opportunities." |

- Keep the illustrations simple — isometric wireframe style (like Linear's FIG 0.2/0.3/0.4 section). If full illustrations are too much work for v1, use clean icons from Lucide or similar with a glowing accent circle behind them.

### 5. Example Idea Card (Social Proof of Quality)
- **Section headline (centered):** "See what an AI-analyzed idea looks like"
- Show ONE real idea card, full-width or near-full-width, with all the fields filled in:
  - Title, source, category, confidence score, market demand summary, competitive notes, suggested next steps
- This is the "show, don't tell" section. The visitor sees the actual quality of output before signing up.
- Card should use glassmorphism styling — semi-transparent dark background with subtle border and backdrop blur. Teal accent on the confidence score badge.

### 6. Value Proposition / Why AIdeaPulse
- **Section headline (large, left-aligned like Linear's value statement):**
  - First line (white): "Stop guessing what to build."
  - Remaining lines (muted gray): "AIdeaPulse does the market research you don't have time for. Real demand signals from real communities, analyzed by AI, delivered before your first cup of coffee."
- This is a big typography moment — large text, lots of whitespace, no images needed. Let the words breathe.

### 7. Pricing Section
- **Section headline (centered):** "Simple pricing. No gotchas."
- Two cards side by side:

| | Free | Pro — $12/mo |
|---|---|---|
| Ideas per day | 50 | 1,000 |
| All 8 sources | ✓ | ✓ |
| AI analysis briefs | ✓ | ✓ |
| Save & rate ideas | ✓ | ✓ |
| Daily email digest | — | ✓ |
| Priority support | — | ✓ |
| | Get Started Free | Upgrade to Pro → |

- **Below pricing cards, a comparison callout:**
  "IdeaBrowser charges $299–$999/year for fewer sources and no AI analysis. AIdeaPulse Pro is $144/year."
  (This is the killer positioning line.)

- **BUG FIX:** The current Pro page shows $9/mo — this needs to be corrected to $12/mo per the decided pricing.

### 8. Final CTA Section
- Dark section with subtle gradient glow
- **Headline (centered):** "Your next startup idea is already trending."
- **Subtitle:** "Join AIdeaPulse and see what the internet is demanding — before everyone else does."
- **Single CTA button (centered, large, teal):** "Get Started Free →"

### 9. Footer
- Three columns:
  - **Product:** Features · Pricing · About
  - **Resources:** API Docs (coming soon) · Changelog
  - **Legal:** Terms · Privacy
- Bottom: "© 2026 AIdeaPulse" + social links if applicable
- Keep it minimal and dark.

---

## Pages to Update

### Homepage (index)
- Complete redesign per above spec.

### About Page
- Remove technical pipeline details (Python, Claude API, Cloudflare Workers).
- Rewrite for the USER: What do they get? Why is it better? Who built it (brief founder note)?
- Keep the "How it works" simple — same 3-step as homepage but expanded slightly.

### Pro Page
- **Fix price from $9/mo to $12/mo**
- Add a visible "Upgrade to Pro" CTA button on the Pro card
- Add the IdeaBrowser comparison line
- Consider merging Pro page content into the homepage pricing section and making /pro redirect to the pricing anchor.

---

## Technical Constraints

- **Stack:** Astro v5 + React islands + Tailwind CSS (already in use)
- **3D hero:** Prefer CSS/SVG animation or a lightweight canvas animation over Three.js. Keep bundle size minimal. A constellation/network-node animation with vanilla JS + canvas is fine. GSAP is acceptable if needed for scroll animations.
- **Images:** Product screenshots should be actual screenshots of the live feed, not mockups. For the isometric illustrations in "How it Works" — SVG preferred.
- **Responsive:** Must work well on mobile. The 3-column sections collapse to single column. Hero text scales down.
- **Performance:** This is a Cloudflare Pages site — it should be fast. No heavy JS frameworks beyond what's already loaded for React islands.

---

## What NOT to Change

- The actual idea feed/cards functionality (just the wrapper around them)
- Auth flow (Clerk)
- API endpoints
- Dashboard page

---

## Priority Order

1. Homepage hero + nav + source logos (biggest visual impact)
2. How it Works section
3. Pricing section (with $12/mo fix)
4. Example idea card section
5. Footer
6. About page rewrite
7. Pro page fixes / redirect
