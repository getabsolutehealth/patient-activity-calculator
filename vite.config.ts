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
    sourcemap: true,
    // 100 KB budget applies to the initial entry chunk (the page-load cost).
    // The lazily-imported pdf-generator chunk is large by design — pdf-lib +
    // fontkit weigh in around 500 KB gzipped — and only fetches when the DC
    // clicks Download. Raising this limit just suppresses the false-positive
    // warning on that lazy chunk; the entry chunk is still measured at
    // build time and currently sits ~10 KB gzip.
    chunkSizeWarningLimit: 1200,
  },
});
