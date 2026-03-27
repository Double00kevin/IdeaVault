import { Hono } from "hono";
import type { Env } from "../index";
import { requireAuth } from "../middleware/auth";

const savedHandler = new Hono<{ Bindings: Env }>();

// All routes require authentication
savedHandler.use("/*", requireAuth());

/** GET /api/saved — List user's saved ideas with ratings. */
savedHandler.get("/", async (c) => {
  const userId = c.get("userId");

  const result = await c.env.DB.prepare(
    `SELECT s.idea_id, s.rating, s.saved_at,
            i.title, i.one_liner, i.confidence_score,
            i.build_complexity, i.source_type
     FROM saved_ideas s
     JOIN ideas i ON s.idea_id = i.id
     WHERE s.user_id = ?
     ORDER BY s.saved_at DESC`,
  )
    .bind(userId)
    .all();

  return c.json({ saved: result.results ?? [] });
});

/** POST /api/saved/:ideaId — Save or rate an idea. */
savedHandler.post("/:ideaId", async (c) => {
  const userId = c.get("userId");
  const ideaId = c.req.param("ideaId");

  let body: { rating?: number } = {};
  try {
    body = await c.req.json();
  } catch {
    // No body is fine — just saving without rating
  }

  const rating = body.rating;
  if (rating !== undefined && (rating < 1 || rating > 5 || !Number.isInteger(rating))) {
    return c.json({ error: "Rating must be an integer between 1 and 5" }, 400);
  }

  // Verify idea exists
  const idea = await c.env.DB.prepare("SELECT id FROM ideas WHERE id = ?")
    .bind(ideaId)
    .first();

  if (!idea) {
    return c.json({ error: "Idea not found" }, 404);
  }

  // Upsert: insert or update rating
  await c.env.DB.prepare(
    `INSERT INTO saved_ideas (user_id, idea_id, rating)
     VALUES (?, ?, ?)
     ON CONFLICT(user_id, idea_id) DO UPDATE SET rating = excluded.rating`,
  )
    .bind(userId, ideaId, rating ?? null)
    .run();

  return c.json({ saved: true, idea_id: ideaId, rating: rating ?? null });
});

/** DELETE /api/saved/:ideaId — Unsave an idea. */
savedHandler.delete("/:ideaId", async (c) => {
  const userId = c.get("userId");
  const ideaId = c.req.param("ideaId");

  await c.env.DB.prepare(
    "DELETE FROM saved_ideas WHERE user_id = ? AND idea_id = ?",
  )
    .bind(userId, ideaId)
    .run();

  return c.json({ removed: true, idea_id: ideaId });
});

export { savedHandler };
