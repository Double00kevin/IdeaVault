import { Hono } from "hono";
import type { Env } from "../index";

const healthHandler = new Hono<{ Bindings: Env }>();

/** GET /api/health — Health check with D1 connectivity test. */
healthHandler.get("/", async (c) => {
  try {
    const result = await c.env.DB.prepare(
      "SELECT COUNT(*) as count FROM ideas",
    ).first<{ count: number }>();

    return c.json({
      status: "ok",
      ideas_count: result?.count ?? 0,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return c.json(
      {
        status: "error",
        error: "D1 connectivity failed",
        timestamp: new Date().toISOString(),
      },
      500,
    );
  }
});

export { healthHandler };
