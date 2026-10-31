import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// The production build the e2e web server runs (see $env.e2e in nuxt.config.ts). Read inside the
// tests: Playwright collects this file before the web server has built anything.
function clientChunks() {
  const dir = ".output-e2e/public/_nuxt";
  return readdirSync(dir)
    .filter((file) => file.endsWith(".js"))
    .map((file) => readFileSync(join(dir, file), "utf8"));
}

test("the client never ships the foods table", () => {
  // Minifiers may write strings with backticks.
  const foodEntry = /["'`]?source["'`]?:\s*["'`]bls-4\.0["'`]\s*,\s*["'`]?id["'`]?:/;
  for (const chunk of clientChunks()) expect(chunk).not.toMatch(foodEntry);
});

// The foods table alone is about 5.7 MB; the whole client stays far below.
test("the client stays within its size budget", () => {
  const bytes = clientChunks().reduce((sum, chunk) => sum + Buffer.byteLength(chunk), 0);
  expect(bytes).toBeLessThan(2_000_000);
});
