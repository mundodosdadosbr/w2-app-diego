import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: [
      "node_modules",
      ".next",
      "tests/e2e/**",
      "tests/evals/**",
      "supabase/**",
      "infra/**",
    ],
    coverage: {
      reporter: ["text", "html"],
      include: ["lib/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
      exclude: ["**/*.{test,spec}.{ts,tsx}"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
