/**
 * GET /api/search — Semantic search over ideas via Vectorize (Phase 3D)
 *
 * Query params:
 *   ?q=natural language query
 *   &limit=10 (default 10, max 20)
 *
 * Embeds the query with BGE-M3, queries Vectorize, returns ranked ideas.
 */

import { Hono } from "hono";
import type { Env } from "../index";

const searchHandler = new Hono<{ Bindings: Env }>();

searchHandler.get("/", async (c) => {
  const query = c.req.query("q");
  if (!query || query.trim().length === 0) {
    return c.json({ error: "Missing ?q= query parameter" }, 400);
  }

  const limit = Math.min(Math.max(parseInt(c.req.query("limit") ?? "10", 10) || 10, 1), 20);

  try {
    // Embed the query
    const embedding = await c.env.AI.run("@cf/baai/bge-m3", {
      text: [query.trim()],
    });

    const queryVector = embedding.data?.[0];
    if (!queryVector) {
      return c.json({ error: "Failed to generate query embedding" }, 500);
    }

    // Query Vectorize
    const results = await c.env.VECTORIZE.query(queryVector, {
      topK: limit,
      returnMetadata: "all",
    });

    if (!results.matches || results.matches.length === 0) {
      return c.json({ query, results: [], message: "No matching ideas found" });
    }

    // Fetch full idea data from D1 for matched IDs
    const ids = results.matches.map((m) => m.id);
    const placeholders = ids.map(() => "?").join(",");
    const ideas = await c.env.DB.prepare(
      `SELECT id, title, one_liner, problem_statement, target_audience,
              build_complexity, confidence_score, product_name, source_type
       FROM ideas WHERE id IN (${placeholders})`,
    )
      .bind(...ids)
      .all();

    // Build a lookup map and merge with similarity scores
    const ideaMap = new Map<string, Record<string, unknown>>();
    if (ideas.results) {
      for (const idea of ideas.results) {
        ideaMap.set(idea.id as string, idea);
      }
    }

    const ranked = results.matches.map((match) => ({
      score: match.score,
      ...ideaMap.get(match.id),
    }));

    return c.json({ query, results: ranked });
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : String(e) },
      500,
    );
  }
});

export { searchHandler };
