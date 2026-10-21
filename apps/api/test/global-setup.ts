import { execSync } from "node:child_process";
import { testDatabaseUrl } from "./test-database";

// Bring the test database up to the latest migration. Tests empty the tables themselves.
export default function setup() {
  execSync("prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: "pipe",
  });
}
