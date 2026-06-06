import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // happy-dom gives us localStorage / Storage / window for the practice-info
    // and state tests. Pure-math tests in calc.test.ts don't touch the DOM but
    // run fine under happy-dom (~1ms overhead per file).
    environment: "happy-dom",
    // Reset localStorage between tests so practice-info tests don't bleed state.
    clearMocks: true,
    restoreMocks: true,
  },
});
