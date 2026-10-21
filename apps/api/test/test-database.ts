import { existsSync } from "node:fs";

/**
 * Tests run against their own database, `<name>_test` next to the one in
 * DATABASE_URL, so they never touch development data.
 */
export function testDatabaseUrl(): string {
  if (!process.env.DATABASE_URL && existsSync(".env")) process.loadEnvFile(".env");
  const base = process.env.DATABASE_URL;
  if (!base) throw new Error("Set DATABASE_URL (or apps/api/.env) to run the tests");
  const url = new URL(base);
  const name = url.pathname.slice(1);
  if (!name.endsWith("_test")) url.pathname = `/${name}_test`;
  return url.toString();
}
