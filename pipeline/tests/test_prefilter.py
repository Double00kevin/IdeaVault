"""Tests for the pre-filter module."""

from pipeline.prefilter import filter_reddit, filter_producthunt, filter_trends
from pipeline.scrapers.reddit import RedditSignal
from pipeline.scrapers.producthunt import ProductHuntSignal
from pipeline.scrapers.google_trends import TrendSignal


def _make_reddit_signal(score: int, comments: int, title: str = "test") -> RedditSignal:
    return RedditSignal(
        subreddit="SaaS",
        title=title,
        selftext="",
        score=score,
        num_comments=comments,
        url="https://reddit.com/test",
        created_utc=1000000.0,
    )


def _make_ph_signal(votes: int, name: str = "TestProduct") -> ProductHuntSignal:
    return ProductHuntSignal(
        name=name,
        tagline="A test product",
        description="",
        votes_count=votes,
        comments_count=0,
        url="https://producthunt.com/test",
        topics=[],
        launched_at="2026-03-26",
    )


class TestFilterReddit:
    def test_returns_top_n_by_engagement(self):
        signals = [
            _make_reddit_signal(10, 5, "low"),    # engagement: 15
            _make_reddit_signal(100, 50, "high"),  # engagement: 150
            _make_reddit_signal(50, 20, "mid"),    # engagement: 70
        ]
        result = filter_reddit(signals, top_n=2)
        assert len(result) == 2
        assert result[0].title == "high"
        assert result[1].title == "mid"

    def test_returns_all_if_fewer_than_n(self):
        signals = [_make_reddit_signal(10, 5)]
        result = filter_reddit(signals, top_n=20)
        assert len(result) == 1

    def test_empty_input(self):
        assert filter_reddit([], top_n=20) == []


class TestFilterProductHunt:
    def test_returns_top_n_by_votes(self):
        signals = [
            _make_ph_signal(10, "low"),
            _make_ph_signal(500, "high"),
            _make_ph_signal(100, "mid"),
        ]
        result = filter_producthunt(signals, top_n=2)
        assert len(result) == 2
        assert result[0].name == "high"
        assert result[1].name == "mid"

    def test_empty_input(self):
        assert filter_producthunt([], top_n=5) == []


class TestFilterTrends:
    def test_passes_all_through(self):
        signals = [
            TrendSignal(keyword="ai tool", source="trending", value=0, related_topics=[]),
            TrendSignal(keyword="saas", source="rising", value=500, related_topics=["tech"]),
        ]
        result = filter_trends(signals)
        assert len(result) == 2
