import { defineConfig } from "vitest/config";
import { testDatabaseUrl } from "./test/test-database";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      LOG_LEVEL: "silent",
      DATABASE_URL: testDatabaseUrl(),
    },
    globalSetup: ["test/global-setup.ts"],
    // Test files share one database, so they run one at a time.
    fileParallelism: false,
  },
});
