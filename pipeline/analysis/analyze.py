"""Claude API analysis module. Takes raw signals and produces structured idea briefs."""

import json
import logging
from dataclasses import dataclass, field

import anthropic

logger = logging.getLogger("ideavault.analysis")


@dataclass
class IdeaBrief:
    """Structured idea brief produced by Claude API analysis."""

    title: str
    one_liner: str
    problem_statement: str
    target_audience: str
    market_size: dict[str, str]  # TAM, SAM, SOM
    competitors: list[str]
    competitor_count: int
    build_complexity: str  # low, medium, high
    build_timeline: str
    monetization_angle: str
    confidence_score: int  # 0-100
    source_links: list[str] = field(default_factory=list)
    source_type: str = ""  # reddit, google_trends, producthunt


ANALYSIS_PROMPT = """You are an expert startup analyst. Analyze the following demand signal and produce a structured startup idea brief.

Input signal:
{signal}

Respond with ONLY valid JSON (no markdown, no code fences) matching this schema:
{{
  "title": "Short idea title (under 60 chars)",
  "one_liner": "One sentence pitch",
  "problem_statement": "What specific problem does this solve?",
  "target_audience": "Who specifically is this for?",
  "market_size": {{
    "tam": "Total addressable market (dollar amount)",
    "sam": "Serviceable addressable market (dollar amount)",
    "som": "Serviceable obtainable market (dollar amount)"
  }},
  "competitors": ["Specific competitor 1", "Specific competitor 2"],
  "build_complexity": "low|medium|high",
  "build_timeline": "Estimated time to MVP (e.g., '2 weekends', '1 month')",
  "monetization_angle": "How to make money (be specific about pricing)",
  "confidence_score": 0-100
}}

Confidence score rubric (0-100):
- Signal strength (30%): Based on engagement metrics provided (upvotes, comments, trend velocity)
- Market clarity (25%): How specific and measurable are the TAM/SAM/SOM estimates
- Competitive gap (25%): Fewer funded competitors = higher score
- Build feasibility (20%): Lower complexity = higher score

Be specific with market sizes (use dollar amounts). Be honest about confidence.
If the signal is weak or not really a startup idea, give a low score (under 30)."""


def create_client(api_key: str) -> anthropic.Anthropic:
    """Create an Anthropic client."""
    return anthropic.Anthropic(api_key=api_key)


def analyze_signal(
    client: anthropic.Anthropic,
    signal_text: str,
    source_links: list[str],
    signal_type: str,
) -> IdeaBrief | None:
    """Analyze a single raw signal and return a structured idea brief."""
    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=1500,
            messages=[
                {
                    "role": "user",
                    "content": ANALYSIS_PROMPT.format(signal=signal_text),
                }
            ],
        )

        raw_text = message.content[0].text.strip()

        # Strip markdown code fences if present
        if raw_text.startswith("```"):
            raw_text = raw_text.split("\n", 1)[1]
            if raw_text.endswith("```"):
                raw_text = raw_text[:-3].strip()

        data = json.loads(raw_text)

        competitors = data.get("competitors", [])
        return IdeaBrief(
            title=data["title"][:100],
            one_liner=data["one_liner"][:200],
            problem_statement=data.get("problem_statement", ""),
            target_audience=data.get("target_audience", ""),
            market_size=data.get("market_size", {"tam": "", "sam": "", "som": ""}),
            competitors=competitors,
            competitor_count=len(competitors),
            build_complexity=data.get("build_complexity", "medium"),
            build_timeline=data.get("build_timeline", ""),
            monetization_angle=data.get("monetization_angle", ""),
            confidence_score=max(0, min(100, int(data.get("confidence_score", 0)))),
            source_links=source_links,
            source_type=signal_type,
        )

    except json.JSONDecodeError as e:
        logger.warning("Failed to parse Claude response as JSON: %s", e)
        return None
    except (KeyError, TypeError) as e:
        logger.warning("Missing required field in Claude response: %s", e)
        return None
    except anthropic.APIError as e:
        logger.error("Claude API error: %s", e)
        return None
