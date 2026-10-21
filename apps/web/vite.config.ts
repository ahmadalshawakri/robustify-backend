import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // The API runs separately in development; in production both share one origin.
    proxy: { "/api": "http://localhost:3001" },
  },
});
