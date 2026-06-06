import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    target: "es2022",
    // No source maps in the published build — don't ship the TS source as a
    // public .map alongside a PHI-handling tool. Flip to true locally if you
    // need to debug a production stack trace.
    sourcemap: false,
  },
});
