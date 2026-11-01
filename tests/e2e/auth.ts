import type { Page } from "@playwright/test";

/** Signs in through the e2e-only route; the session cookie lands in the page's context. */
export async function signInAs(page: Page, name = "Flo Tester", providerId = "e2e-1") {
  const response = await page.request.post("/api/test/login", {
    data: { provider: "google", providerId, name },
  });
  if (!response.ok()) throw new Error(`test login failed: ${response.status()}`);
  return (await response.json()) as { id: number; name: string };
}
