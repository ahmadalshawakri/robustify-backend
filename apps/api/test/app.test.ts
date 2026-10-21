import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const healthy = async () => {};
const unreachable = async () => {
  throw new Error("connection refused");
};

describe("GET /api/health", () => {
  it("reports ok when the database answers", async () => {
    const res = await request(createApp({ checkDatabase: healthy })).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", database: "ok" });
  });

  it("returns 503 when the database is unreachable", async () => {
    const res = await request(createApp({ checkDatabase: unreachable })).get("/api/health");
    expect(res.status).toBe(503);
    expect(res.body.database).toBe("unreachable");
  });
});

describe("errors", () => {
  const app = createApp({ checkDatabase: healthy });

  it("answers unknown API routes with a JSON 404", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("not_found");
  });

  it("answers malformed JSON with a 400 instead of a stack trace", async () => {
    const res = await request(app)
      .post("/api/health")
      .set("Content-Type", "application/json")
      .send("{not json");
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("bad_request");
  });

  it("sets security headers", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});

describe("serving the web app", () => {
  const webDist = mkdtempSync(path.join(tmpdir(), "robustify-web-"));
  writeFileSync(path.join(webDist, "index.html"), "<!doctype html><title>Robustify</title>");
  const app = createApp({ checkDatabase: healthy, webDist });

  it("serves index.html for client-side routes", async () => {
    const res = await request(app).get("/orders/42").set("Accept", "text/html");
    expect(res.status).toBe(200);
    expect(res.text).toContain("<title>Robustify</title>");
  });

  it("accepts a relative web directory", async () => {
    const relative = path.relative(process.cwd(), webDist);
    const res = await request(createApp({ checkDatabase: healthy, webDist: relative }))
      .get("/")
      .set("Accept", "text/html");
    expect(res.status).toBe(200);
  });

  it("does not swallow unknown API routes", async () => {
    const res = await request(app).get("/api/nope").set("Accept", "text/html");
    expect(res.status).toBe(404);
  });
});
