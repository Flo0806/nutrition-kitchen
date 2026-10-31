import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
    // Setup ships no logic yet; the first real tests arrive with the foods api.
    passWithNoTests: true,
  },
});
