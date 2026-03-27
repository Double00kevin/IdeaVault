import { describe, it, expect } from "vitest";
import { getClaimDate, stripIdeaFields, teaserIdeaFields } from "./ideas";

/** Helper to create a full formatted idea for testing. */
function makeFakeIdea(overrides: Partial<ReturnType<typeof stripIdeaFields>> & Record<string, any> = {}) {
  return {
    id: "idea-001",
    title: "AI Pet Therapist",
    one_liner: "Use LLMs to diagnose pet behavioral issues",
    problem_statement: "Pet owners struggle with behavioral issues",
    target_audience: "Pet owners aged 25-45",
    market_size: { tam: "$5B", sam: "$1B", som: "$100M" },
    competitors: ["PetCoach", "Wagmo"],
    competitor_count: 2,
    build_complexity: "medium",
    build_timeline: "3-6 months",
    monetization_angle: "Subscription + vet referrals",
    confidence_score: 78,
    source_links: ["https://reddit.com/r/pets/abc"],
    source_type: "reddit",
    created_at: "2026-03-27T12:00:00Z",
    ...overrides,
  };
}

describe("stripIdeaFields", () => {
  it("returns only public-safe fields", () => {
    const idea = makeFakeIdea();
    const stripped = stripIdeaFields(idea);

    expect(stripped).toEqual({
      id: "idea-001",
      title: "AI Pet Therapist",
      category: "reddit",
      confidence_score: 78,
      created_at: "2026-03-27T12:00:00Z",
    });
  });

  it("does not leak sensitive fields", () => {
    const idea = makeFakeIdea();
    const stripped = stripIdeaFields(idea);
    const keys = Object.keys(stripped);

    expect(keys).not.toContain("one_liner");
    expect(keys).not.toContain("problem_statement");
    expect(keys).not.toContain("target_audience");
    expect(keys).not.toContain("market_size");
    expect(keys).not.toContain("competitors");
    expect(keys).not.toContain("monetization_angle");
    expect(keys).not.toContain("source_links");
  });
});

describe("teaserIdeaFields", () => {
  it("returns stripped fields plus one_liner", () => {
    const idea = makeFakeIdea();
    const teaser = teaserIdeaFields(idea);

    expect(teaser).toEqual({
      id: "idea-001",
      title: "AI Pet Therapist",
      category: "reddit",
      confidence_score: 78,
      created_at: "2026-03-27T12:00:00Z",
      one_liner: "Use LLMs to diagnose pet behavioral issues",
    });
  });

  it("does not include full detail fields", () => {
    const idea = makeFakeIdea();
    const teaser = teaserIdeaFields(idea);
    const keys = Object.keys(teaser);

    expect(keys).not.toContain("problem_statement");
    expect(keys).not.toContain("target_audience");
    expect(keys).not.toContain("market_size");
    expect(keys).not.toContain("competitors");
    expect(keys).not.toContain("source_links");
  });
});

describe("getClaimDate", () => {
  it("returns today's date when hour >= 6 UTC", () => {
    // 2026-03-27 at 10:00 UTC → claim date is 2026-03-27
    const date = new Date("2026-03-27T10:00:00Z");
    expect(getClaimDate(date)).toBe("2026-03-27");
  });

  it("returns yesterday's date when hour < 6 UTC", () => {
    // 2026-03-27 at 03:00 UTC → still belongs to 2026-03-26 claim period
    const date = new Date("2026-03-27T03:00:00Z");
    expect(getClaimDate(date)).toBe("2026-03-26");
  });

  it("returns yesterday at exactly 05:59 UTC", () => {
    const date = new Date("2026-03-27T05:59:59Z");
    expect(getClaimDate(date)).toBe("2026-03-26");
  });

  it("returns today at exactly 06:00 UTC", () => {
    const date = new Date("2026-03-27T06:00:00Z");
    expect(getClaimDate(date)).toBe("2026-03-27");
  });

  it("handles midnight correctly — still previous day's claim period", () => {
    const date = new Date("2026-03-27T00:00:00Z");
    expect(getClaimDate(date)).toBe("2026-03-26");
  });

  it("handles month boundary correctly", () => {
    // April 1st at 03:00 UTC → claim date is March 31
    const date = new Date("2026-04-01T03:00:00Z");
    expect(getClaimDate(date)).toBe("2026-03-31");
  });

  it("handles year boundary correctly", () => {
    // Jan 1st at 02:00 UTC → claim date is Dec 31 previous year
    const date = new Date("2026-01-01T02:00:00Z");
    expect(getClaimDate(date)).toBe("2025-12-31");
  });
});
