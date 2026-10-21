import { defineConfig } from "tsup";

export default defineConfig({
  entry: { server: "src/server.ts", seed: "prisma/seed.ts" },
  format: "esm",
  target: "node22",
  platform: "node",
  clean: true,
  sourcemap: true,
  // Workspace packages ship TypeScript source, so they are bundled in.
  noExternal: [/^@robustify\//],
});
