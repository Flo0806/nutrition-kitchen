import { spawn } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

/** Starts the built server with `env` and resolves when it exits, with what it printed. */
function start(port: number, env: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "nutrition-kitchen-start-"));
  const server = spawn("node", [".output-e2e/server/index.mjs"], {
    env: {
      PATH: process.env.PATH ?? "",
      NUXT_DATABASE_PATH: join(dir, "db.sqlite"),
      PORT: String(port),
      ...env,
    },
  });
  let output = "";
  server.stdout.on("data", (chunk) => (output += chunk));
  server.stderr.on("data", (chunk) => (output += chunk));
  return new Promise<{ code: number | null; output: string }>((resolve) => {
    // A server that keeps running did not refuse.
    const timer = setTimeout(() => server.kill(), 5000);
    server.on("exit", (code) => {
      clearTimeout(timer);
      rmSync(dir, { recursive: true, force: true });
      resolve({ code, output });
    });
  });
}

test("the server does not start without an app secret", async () => {
  const { code, output } = await start(3109, {});
  expect(code).not.toBeNull();
  expect(output).toMatch(/Invalid configuration:[\s\S]*appSecret/);
});

test("the server does not start with a short app secret", async () => {
  const { code, output } = await start(3110, { NUXT_APP_SECRET: "too-short" });
  expect(code).not.toBeNull();
  expect(output).toContain("Invalid configuration:");
  expect(output).toContain("NUXT_APP_SECRET needs at least 32 characters");
});
