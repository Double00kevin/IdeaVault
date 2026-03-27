"""Reddit scraper using PRAW. Pulls demand signals from startup/SaaS + domain subreddits."""

import logging
from dataclasses import dataclass

import praw

from pipeline.config import RedditConfig

logger = logging.getLogger("ideavault.scrapers.reddit")

# Builder-focused subreddits (idea discovery)
BUILDER_SUBREDDITS = [
    "SaaS",
    "startups",
    "Entrepreneur",
    "smallbusiness",
    "SideProject",
]

# Domain-specific subreddits (user pain points = higher quality signals)
DOMAIN_SUBREDDITS = [
    "webdev",
    "freelance",
    "accounting",
    "realestate",
    "teachers",
]

TARGET_SUBREDDITS = BUILDER_SUBREDDITS + DOMAIN_SUBREDDITS


@dataclass
class RedditSignal:
    """A raw demand signal extracted from a Reddit post."""

    subreddit: str
    title: str
    selftext: str
    score: int
    num_comments: int
    url: str
    created_utc: float


def create_client(config: RedditConfig) -> praw.Reddit:
    """Create an authenticated Reddit client."""
    return praw.Reddit(
        client_id=config.client_id,
        client_secret=config.client_secret,
        user_agent=config.user_agent,
    )


def scrape_subreddit(
    client: praw.Reddit,
    subreddit_name: str,
    limit: int = 50,
    time_filter: str = "week",
) -> list[RedditSignal]:
    """Scrape top posts from a subreddit for demand signals."""
    try:
        subreddit = client.subreddit(subreddit_name)
        signals: list[RedditSignal] = []

        for post in subreddit.top(time_filter=time_filter, limit=limit):
            signals.append(
                RedditSignal(
                    subreddit=subreddit_name,
                    title=post.title,
                    selftext=post.selftext[:2000],
                    score=post.score,
                    num_comments=post.num_comments,
                    url=f"https://reddit.com{post.permalink}",
                    created_utc=post.created_utc,
                )
            )

        logger.info("Scraped %d posts from r/%s", len(signals), subreddit_name)
        return signals
    except Exception as e:
        logger.error("Failed to scrape r/%s: %s", subreddit_name, e)
        return []


def scrape_all(config: RedditConfig, limit: int = 50) -> list[RedditSignal]:
    """Scrape all target subreddits and return combined signals."""
    client = create_client(config)
    all_signals: list[RedditSignal] = []

    for sub in TARGET_SUBREDDITS:
        signals = scrape_subreddit(client, sub, limit=limit)
        all_signals.extend(signals)

    logger.info("Total Reddit signals: %d", len(all_signals))
    return all_signals
