import type { Page } from "@playwright/test";

/** Opens a page and waits until Vue has hydrated it; before that, typing and clicking go nowhere. */
export async function openReady(page: Page, path: string) {
  await page.goto(path);
  await waitForHydration(page);
}

export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => {
    const app = (window as { useNuxtApp?: () => { isHydrating?: boolean } }).useNuxtApp?.();
    return app !== undefined && app.isHydrating === false;
  });
}
