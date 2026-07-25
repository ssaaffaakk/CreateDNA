import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Pure-logic unit tests run in Node (no DOM needed): the analysis/palette/merge
// helpers all operate on plain arrays and objects.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
