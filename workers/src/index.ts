import { Hono } from "hono";
import { cors } from "hono/cors";
import { ingestHandler } from "./routes/ingest";
import { ideasHandler } from "./routes/ideas";
import { savedHandler } from "./routes/saved";
import { digestHandler } from "./routes/digest";
import { healthHandler } from "./routes/health";
import { ogHandler } from "./routes/og";

export interface Env {
  DB: D1Database;
  INGEST_WEBHOOK_SECRET: string;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

// CORS for frontend
app.use("/api/*", cors({
  origin: "*", // Tighten after deploy
  allowMethods: ["GET", "POST", "DELETE"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Routes
app.route("/api/ingest", ingestHandler);
app.route("/api/ideas", ideasHandler);
app.route("/api/saved", savedHandler);
app.route("/api/digest", digestHandler);
app.route("/api/health", healthHandler);
app.route("/api/og", ogHandler);

// Catch-all 404
app.all("*", (c) => c.json({ error: "Not found" }, 404));

export default app;
