"""Main pipeline entrypoint. Run via systemd timer or manually."""

import logging
import time

from pipeline.analysis.analyze import IdeaBrief, analyze_signal, create_client
from pipeline.config import load_config
from pipeline.prefilter import filter_producthunt, filter_reddit, filter_trends
from pipeline.push.cloudflare import push_ideas
from pipeline.scrapers.google_trends import TrendSignal, scrape_all as scrape_trends
from pipeline.scrapers.producthunt import ProductHuntSignal, scrape_all as scrape_ph
from pipeline.scrapers.reddit import RedditSignal, scrape_all as scrape_reddit

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ideavault.pipeline")

MIN_CONFIDENCE = 30


def _format_reddit_signal(signal: RedditSignal) -> tuple[str, list[str]]:
    """Format a Reddit signal for Claude analysis."""
    text = f"Subreddit: r/{signal.subreddit}\n"
    text += f"Title: {signal.title}\n"
    text += f"Score: {signal.score} | Comments: {signal.num_comments}\n"
    if signal.selftext:
        text += f"Content: {signal.selftext[:1500]}\n"
    return text, [signal.url]


def _format_ph_signal(signal: ProductHuntSignal) -> tuple[str, list[str]]:
    """Format a Product Hunt signal for Claude analysis."""
    text = f"Product: {signal.name}\n"
    text += f"Tagline: {signal.tagline}\n"
    text += f"Votes: {signal.votes_count} | Comments: {signal.comments_count}\n"
    if signal.description:
        text += f"Description: {signal.description[:800]}\n"
    if signal.topics:
        text += f"Topics: {', '.join(signal.topics)}\n"
    return text, [signal.url]


def _format_trend_signal(signal: TrendSignal) -> tuple[str, list[str]]:
    """Format a Google Trends signal for Claude analysis."""
    text = f"Trending keyword: {signal.keyword}\n"
    text += f"Type: {signal.source}\n"
    if signal.value:
        text += f"Growth: {signal.value}%\n"
    if signal.related_topics:
        text += f"Related to: {', '.join(signal.related_topics)}\n"
    return text, []


def run() -> None:
    """Run the full ingestion pipeline: scrape → pre-filter → analyze → push."""
    start = time.time()
    logger.info("Starting IdeaVault ingestion pipeline")

    config = load_config()
    logger.info("Config loaded successfully")

    # Step 1: Scrape signals from all sources
    logger.info("Scraping signals...")
    reddit_signals = scrape_reddit(config.reddit)
    ph_signals = scrape_ph(config.producthunt_access_token)
    trend_signals = scrape_trends()

    total_raw = len(reddit_signals) + len(ph_signals) + len(trend_signals)
    logger.info("Raw signals: %d total (Reddit: %d, PH: %d, Trends: %d)",
                total_raw, len(reddit_signals), len(ph_signals), len(trend_signals))

    # Step 2: Pre-filter by engagement
    logger.info("Pre-filtering signals...")
    reddit_filtered = filter_reddit(reddit_signals)
    ph_filtered = filter_producthunt(ph_signals)
    trend_filtered = filter_trends(trend_signals)

    # Step 3: Analyze with Claude API
    logger.info("Analyzing signals with Claude API...")
    claude_client = create_client(config.anthropic_api_key)
    ideas: list[IdeaBrief] = []

    # Analyze Reddit signals
    for signal in reddit_filtered:
        text, links = _format_reddit_signal(signal)
        brief = analyze_signal(claude_client, text, links, "reddit")
        if brief and brief.confidence_score >= MIN_CONFIDENCE:
            ideas.append(brief)
        elif brief:
            logger.debug("Discarded low-confidence idea: %s (%d)",
                         brief.title, brief.confidence_score)

    # Analyze Product Hunt signals
    for signal in ph_filtered:
        text, links = _format_ph_signal(signal)
        brief = analyze_signal(claude_client, text, links, "producthunt")
        if brief and brief.confidence_score >= MIN_CONFIDENCE:
            ideas.append(brief)

    # Analyze Google Trends signals
    for signal in trend_filtered:
        text, links = _format_trend_signal(signal)
        brief = analyze_signal(claude_client, text, links, "google_trends")
        if brief and brief.confidence_score >= MIN_CONFIDENCE:
            ideas.append(brief)

    logger.info("Analyzed %d signals, produced %d ideas above confidence threshold",
                len(reddit_filtered) + len(ph_filtered) + len(trend_filtered),
                len(ideas))

    # Step 4: Push to Cloudflare (dedup happens in Workers)
    if ideas:
        logger.info("Pushing %d ideas to Cloudflare...", len(ideas))
        result = push_ideas(config.cloudflare, ideas)
        if result:
            logger.info("Push result: %s", result)
        else:
            logger.error("Push failed, ideas spooled to disk")
    else:
        logger.warning("No ideas to push")

    elapsed = time.time() - start
    logger.info("Pipeline complete in %.1fs", elapsed)


if __name__ == "__main__":
    run()
