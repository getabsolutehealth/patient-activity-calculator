import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Unit tests live in src/. The Playwright e2e specs in e2e/ run under
    // `npm run e2e`, NOT vitest — scope vitest to src so it doesn't try to
    // collect (and choke on) the @playwright/test imports.
    include: ["src/**/*.test.ts"],
    // happy-dom gives the state/component tests a DOM; the pure-math calc
    // tests run fine under it too (~1ms overhead per file).
    environment: "happy-dom",
    clearMocks: true,
    restoreMocks: true,
  },
});
