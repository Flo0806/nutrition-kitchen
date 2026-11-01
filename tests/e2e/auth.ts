import { test, type Page } from "@playwright/test";

/**
 * Signs in through the e2e-only route; the session cookie lands in the page's context. Each test,
 * browser and repeat gets a user of its own by default: they all share one database.
 */
export async function signInAs(page: Page, name = "Flo Tester", account = "") {
  const info = test.info();
  const providerId = `${info.testId}-${info.repeatEachIndex}-${account}`;
  const response = await page.request.post("/api/test/login", {
    data: { provider: "google", providerId, name },
  });
  if (!response.ok()) throw new Error(`test login failed: ${response.status()}`);
  return (await response.json()) as { id: number; name: string };
}
