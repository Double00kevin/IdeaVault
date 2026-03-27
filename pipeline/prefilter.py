"""Pre-filter raw signals by engagement before sending to Claude API.

Per-source quotas:
- Reddit: top 20 by (score + num_comments)
- Product Hunt: top 5 by votes_count
- Google Trends: all signals pass through (no engagement metric)
"""

import logging

from pipeline.scrapers.reddit import RedditSignal
from pipeline.scrapers.producthunt import ProductHuntSignal
from pipeline.scrapers.google_trends import TrendSignal

logger = logging.getLogger("ideavault.prefilter")


def filter_reddit(signals: list[RedditSignal], top_n: int = 20) -> list[RedditSignal]:
    """Keep top N Reddit signals by engagement (score + comments)."""
    sorted_signals = sorted(
        signals,
        key=lambda s: s.score + s.num_comments,
        reverse=True,
    )
    filtered = sorted_signals[:top_n]
    logger.info(
        "Reddit: %d → %d signals (filtered by engagement)",
        len(signals), len(filtered),
    )
    return filtered


def filter_producthunt(
    signals: list[ProductHuntSignal], top_n: int = 5,
) -> list[ProductHuntSignal]:
    """Keep top N Product Hunt signals by vote count."""
    sorted_signals = sorted(
        signals,
        key=lambda s: s.votes_count,
        reverse=True,
    )
    filtered = sorted_signals[:top_n]
    logger.info(
        "Product Hunt: %d → %d signals (filtered by votes)",
        len(signals), len(filtered),
    )
    return filtered


def filter_trends(signals: list[TrendSignal]) -> list[TrendSignal]:
    """Pass all Google Trends signals through (no engagement metric)."""
    logger.info("Google Trends: %d signals (all pass through)", len(signals))
    return signals
