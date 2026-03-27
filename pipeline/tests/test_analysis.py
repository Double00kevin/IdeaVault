"""Tests for the Claude API analysis module."""

import json
from unittest.mock import MagicMock, patch

from pipeline.analysis.analyze import IdeaBrief, analyze_signal


def _mock_claude_response(json_data: dict) -> MagicMock:
    """Create a mock Claude API response."""
    mock_msg = MagicMock()
    mock_content = MagicMock()
    mock_content.text = json.dumps(json_data)
    mock_msg.content = [mock_content]
    return mock_msg


VALID_IDEA = {
    "title": "AI Resume Screener",
    "one_liner": "Auto-screen resumes for SMBs",
    "problem_statement": "Small businesses waste hours reviewing unqualified resumes",
    "target_audience": "HR managers at 10-50 person companies",
    "market_size": {"tam": "$5B", "sam": "$500M", "som": "$50M"},
    "competitors": ["Lever", "Greenhouse"],
    "build_complexity": "medium",
    "build_timeline": "3 weekends",
    "monetization_angle": "$29/mo per seat",
    "confidence_score": 72,
}


class TestAnalyzeSignal:
    def test_parses_valid_response(self):
        mock_client = MagicMock()
        mock_client.messages.create.return_value = _mock_claude_response(VALID_IDEA)

        result = analyze_signal(mock_client, "test signal", ["https://reddit.com/test"], "reddit")

        assert result is not None
        assert result.title == "AI Resume Screener"
        assert result.confidence_score == 72
        assert result.competitor_count == 2
        assert result.source_type == "reddit"

    def test_handles_malformed_json(self):
        mock_client = MagicMock()
        mock_msg = MagicMock()
        mock_content = MagicMock()
        mock_content.text = "not valid json at all"
        mock_msg.content = [mock_content]
        mock_client.messages.create.return_value = mock_msg

        result = analyze_signal(mock_client, "test", [], "reddit")
        assert result is None

    def test_handles_missing_required_fields(self):
        mock_client = MagicMock()
        mock_client.messages.create.return_value = _mock_claude_response({"foo": "bar"})

        result = analyze_signal(mock_client, "test", [], "reddit")
        assert result is None

    def test_clamps_confidence_score(self):
        data = {**VALID_IDEA, "confidence_score": 150}
        mock_client = MagicMock()
        mock_client.messages.create.return_value = _mock_claude_response(data)

        result = analyze_signal(mock_client, "test", [], "reddit")
        assert result is not None
        assert result.confidence_score == 100

    def test_strips_markdown_code_fences(self):
        mock_client = MagicMock()
        mock_msg = MagicMock()
        mock_content = MagicMock()
        mock_content.text = "```json\n" + json.dumps(VALID_IDEA) + "\n```"
        mock_msg.content = [mock_content]
        mock_client.messages.create.return_value = mock_msg

        result = analyze_signal(mock_client, "test", [], "reddit")
        assert result is not None
        assert result.title == "AI Resume Screener"

    def test_truncates_long_title(self):
        data = {**VALID_IDEA, "title": "A" * 200}
        mock_client = MagicMock()
        mock_client.messages.create.return_value = _mock_claude_response(data)

        result = analyze_signal(mock_client, "test", [], "reddit")
        assert result is not None
        assert len(result.title) == 100
