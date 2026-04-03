/**
 * POST /api/embed — Generate and store idea embeddings in Vectorize (Phase 3C)
 *
 * Protected by HMAC signature (same auth as ingest webhook).
 * Fetches ideas missing embeddings, generates BGE-M3 vectors, upserts to Vectorize.
 *
 * Query params:
 *   ?limit=50 (batch size, default 50, max 100)
 *   &force=true (re-embed all ideas, not just missing)
 */

import { Hono } from "hono";
import type { Env } from "../index";

const embedHandler = new Hono<{ Bindings: Env }>();

/** Build the text to embed for a given idea. */
function buildEmbeddingText(idea: Record<string, unknown>): string {
  const parts = [
    idea.title,
    idea.one_liner,
    idea.problem_statement,
    idea.target_audience,
    idea.monetization_angle,
  ].filter(Boolean);
  return parts.join(" | ");
}

embedHandler.post("/", async (c) => {
  // Auth: check HMAC signature (same as ingest)
  const signature = c.req.header("x-webhook-signature") ?? "";
  const timestamp = c.req.header("x-webhook-timestamp") ?? "";

  const ts = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(ts) || Math.abs(now - ts) > 300) {
    return c.json({ error: "Stale or invalid timestamp" }, 401);
  }

  const body = await c.req.arrayBuffer();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(c.env.INGEST_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, body));
  const received = new Uint8Array(
    (signature.match(/.{2}/g) ?? []).map((b) => parseInt(b, 16)),
  );
  if (expected.length !== received.length) {
    return c.json({ error: "Invalid signature" }, 401);
  }
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected[i] ^ received[i];
  }
  if (mismatch !== 0) {
    return c.json({ error: "Invalid signature" }, 401);
  }

  // Parse params
  const url = new URL(c.req.url);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1), 100);
  const force = url.searchParams.get("force") === "true";

  try {
    // Fetch ideas to embed
    const query = force
      ? "SELECT id, title, one_liner, problem_statement, target_audience, monetization_angle FROM ideas ORDER BY created_at DESC LIMIT ?"
      : "SELECT id, title, one_liner, problem_statement, target_audience, monetization_angle FROM ideas WHERE id NOT IN (SELECT id FROM idea_embeddings) ORDER BY created_at DESC LIMIT ?";

    const ideas = await c.env.DB.prepare(query).bind(limit).all();

    if (!ideas.results || ideas.results.length === 0) {
      return c.json({ embedded: 0, message: "All ideas already have embeddings" });
    }

    // Generate embeddings in batches of 10
    const BATCH_SIZE = 10;
    let totalEmbedded = 0;
    const errors: string[] = [];

    for (let i = 0; i < ideas.results.length; i += BATCH_SIZE) {
      const batch = ideas.results.slice(i, i + BATCH_SIZE);
      const texts = batch.map(buildEmbeddingText);

      const result = await c.env.AI.run("@cf/baai/bge-m3", { text: texts });

      if (!result.data || result.data.length !== batch.length) {
        errors.push(`Batch ${i}: embedding count mismatch`);
        continue;
      }

      // Upsert vectors to Vectorize
      const vectors = batch.map((idea, idx) => ({
        id: idea.id as string,
        values: result.data[idx],
        metadata: {
          title: (idea.title as string) ?? "",
          one_liner: (idea.one_liner as string) ?? "",
        },
      }));

      await c.env.VECTORIZE.upsert(vectors);

      // Track which ideas have embeddings in D1
      for (const idea of batch) {
        await c.env.DB.prepare(
          "INSERT OR REPLACE INTO idea_embeddings (id, embedded_at) VALUES (?, ?)",
        )
          .bind(idea.id, new Date().toISOString())
          .run();
      }

      totalEmbedded += batch.length;
    }

    return c.json({
      embedded: totalEmbedded,
      errors: errors.length > 0 ? errors : undefined,
      total_ideas: ideas.results.length,
    });
  } catch (e) {
    return c.json(
      { error: e instanceof Error ? e.message : String(e) },
      500,
    );
  }
});

export { embedHandler };
