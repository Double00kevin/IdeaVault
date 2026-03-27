import { describe, it, expect } from "vitest";
import { env, createExecutionContext, waitOnExecutionContext } from "cloudflare:test";
import app from "../src/index";

describe("GET /api/health", () => {
  it("returns ok status", async () => {
    const req = new Request("http://localhost/api/health");
    const ctx = createExecutionContext();
    const res = await app.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = await res.json() as { status: string };
    expect(body.status).toBe("ok");
  });
});

describe("GET /api/ideas", () => {
  it("returns empty array when no ideas exist", async () => {
    const req = new Request("http://localhost/api/ideas");
    const ctx = createExecutionContext();
    const res = await app.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(200);
    const body = await res.json() as { ideas: unknown[]; has_more: boolean };
    expect(body.ideas).toEqual([]);
    expect(body.has_more).toBe(false);
  });
});

describe("GET /api/ideas/:id", () => {
  it("returns 404 for non-existent idea", async () => {
    const req = new Request("http://localhost/api/ideas/nonexistent");
    const ctx = createExecutionContext();
    const res = await app.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(404);
  });
});

describe("POST /api/ingest", () => {
  it("rejects missing auth headers", async () => {
    const req = new Request("http://localhost/api/ingest", {
      method: "POST",
      body: JSON.stringify({ ideas: [] }),
    });
    const ctx = createExecutionContext();
    const res = await app.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(401);
  });
});

describe("Catch-all", () => {
  it("returns 404 for unknown routes", async () => {
    const req = new Request("http://localhost/api/nonexistent");
    const ctx = createExecutionContext();
    const res = await app.fetch(req, env, ctx);
    await waitOnExecutionContext(ctx);

    expect(res.status).toBe(404);
  });
});
