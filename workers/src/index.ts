import { Hono } from "hono";
import { cors } from "hono/cors";
import { ideasHandler } from "./routes/ideas";
import { savedHandler } from "./routes/saved";
import { profileHandler } from "./routes/profile";
import { digestHandler } from "./routes/digest";
import { stripeHandler } from "./routes/stripe";
import { healthHandler } from "./routes/health";
import { ogHandler } from "./routes/og";
import { trendsHandler } from "./routes/trends";
import { exportHandler } from "./routes/export";
import { searchHandler } from "./routes/search";
import { embedHandler } from "./routes/embed";
import { requireAuth } from "./middleware/auth";

// Re-export Durable Object class for Cloudflare runtime
export { RateLimiterDO } from "./rate-limiter-do";

export interface Env {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  DB: D1Database;
  RATE_LIMITER: DurableObjectNamespace;
  INGEST_WEBHOOK_SECRET: string;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  STRIPE_PRICE_ID: string;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS for frontend
app.use("/api/*", cors({
  origin: ["https://aideapulse.com", "https://www.aideapulse.com", "https://aideapulse-site.pages.dev"],
  allowMethods: ["GET", "POST", "DELETE"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Routes
app.route("/api/ideas", ideasHandler);
app.route("/api/saved", savedHandler);
app.route("/api/profile", profileHandler);
app.route("/api/digest", digestHandler);
app.route("/api/stripe", stripeHandler);
app.route("/api/health", healthHandler);
app.route("/api/og", ogHandler);
app.route("/api/trends", trendsHandler);
app.route("/api/export", exportHandler);
app.route("/api/search", searchHandler);
app.route("/api/embed", embedHandler);

// Subscription status check (authenticated)
app.get("/api/subscription", requireAuth(), async (c) => {
  const userId = c.get("userId");
  const sub = await c.env.DB.prepare(
    "SELECT plan, status FROM subscriptions WHERE user_id = ? AND status = 'active'",
  )
    .bind(userId)
    .first<{ plan: string; status: string }>();

  return c.json({
    plan: sub?.plan ?? "free",
    active: !!sub,
  });
});

// Catch-all 404
app.all("*", (c) => c.json({ error: "Not found" }, 404));

export default app;
