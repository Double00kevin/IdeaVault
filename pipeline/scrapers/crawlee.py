"""Crawlee research database scraper. Reads from local crawlee.db on KITT.

Pulls scraped signals from the crawlee-research project's SQLite database,
skipping sources that AIdeaPulse already scrapes natively to avoid duplicate
Claude API spend.
"""

import logging
import os
import sqlite3
from dataclasses import dataclass

logger = logging.getLogger("aideapulse.scrapers.crawlee")

# Default path to crawlee-research database on KITT
DEFAULT_DB_PATH = os.environ.get(
    "CRAWLEE_DB_PATH", "/home/doubl/crawlee-research/data/crawlee.db"
)

# Sources AIdeaPulse already scrapes natively — skip these from crawlee
# to avoid wasting Claude API credits on duplicate analysis.
# Override via CRAWLEE_EXCLUDE_SOURCES env var (comma-separated).
_exclude_env = os.environ.get("CRAWLEE_EXCLUDE_SOURCES")
NATIVE_SOURCES = (
    set(_exclude_env.split(",")) if _exclude_env
    else {"reddit", "hackernews", "github"}
)


@dataclass
class CrawleeSignal:
    """A raw demand signal from the crawlee-research SQLite database."""

    source: str
    title: str
    content: str
    url: str
    author: str
    score: int
    tags: str
    scraped_at: str


def scrape_all(
    db_path: str = DEFAULT_DB_PATH,
    days_back: int = 7,
    limit: int = 100,
) -> list[CrawleeSignal]:
    """Read recent results from crawlee.db, excluding native AIdeaPulse sources."""
    if not os.path.exists(db_path):
        logger.error("Crawlee database not found: %s", db_path)
        return []

    try:
        conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
    except sqlite3.Error as e:
        logger.error("Failed to open crawlee database: %s", e)
        return []

    # Build exclusion placeholders
    exclude_placeholders = ",".join("?" for _ in NATIVE_SOURCES)
    exclude_values = list(NATIVE_SOURCES)

    query = f"""
        SELECT source, title, content, url, author, score, tags, scraped_at
        FROM results
        WHERE scraped_at >= datetime('now', '-' || ? || ' days')
          AND source NOT IN ({exclude_placeholders})
        ORDER BY score DESC
        LIMIT ?
    """

    try:
        cursor = conn.execute(query, [days_back, *exclude_values, limit])
        rows = cursor.fetchall()
    except sqlite3.Error as e:
        logger.error("Failed to query crawlee database: %s", e)
        conn.close()
        return []

    conn.close()

    signals: list[CrawleeSignal] = []
    for row in rows:
        signals.append(
            CrawleeSignal(
                source=row["source"],
                title=row["title"] or "",
                content=(row["content"] or "")[:2000],
                url=row["url"] or "",
                author=row["author"] or "",
                score=row["score"] or 0,
                tags=row["tags"] or "",
                scraped_at=row["scraped_at"] or "",
            )
        )

    sources_found = set(s.source for s in signals)
    logger.info(
        "Crawlee: %d signals from %s (excluded native: %s)",
        len(signals), sources_found or "none", NATIVE_SOURCES,
    )
    return signals
