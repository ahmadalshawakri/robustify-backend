import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/env";

const valid = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/robustify",
  SESSION_SECRET: "x".repeat(32),
};

describe("loadEnv", () => {
  it("applies defaults", () => {
    const env = loadEnv(valid);
    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe("development");
    expect(env.DEMO_MODE).toBe(false);
  });

  it("needs a seed password to run the self-resetting demo", () => {
    expect(() => loadEnv({ ...valid, DEMO_MODE: "true" })).toThrow(/SEED_PASSWORD/);
    expect(loadEnv({ ...valid, DEMO_MODE: "true", SEED_PASSWORD: "longenough" }).DEMO_MODE).toBe(
      true,
    );
  });

  it("refuses to start without a strong session secret", () => {
    expect(() => loadEnv({ ...valid, SESSION_SECRET: "short" })).toThrow(/SESSION_SECRET/);
  });

  it("refuses to start without a database URL", () => {
    expect(() => loadEnv({ SESSION_SECRET: valid.SESSION_SECRET })).toThrow(/DATABASE_URL/);
  });
});
