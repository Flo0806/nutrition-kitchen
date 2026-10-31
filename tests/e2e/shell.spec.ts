import { expect, test } from "@playwright/test";
import { openReady, waitForHydration } from "./ready";

const pages = ["/", "/sources", "/imprint", "/privacy"];

test.describe("attribution", () => {
  for (const path of pages) {
    test(`${path} names the BLS in German and English`, async ({ page }) => {
      await openReady(page, path);
      const attribution = page.getByTestId("attribution");
      await expect(attribution).toHaveText(
        "Nährwerte: Max Rubner-Institut, Bundeslebensmittelschlüssel (BLS), Version 4.0, als Auszug, CC BY 4.0",
      );
      await expect(attribution.getByRole("link", { name: /BLS/ })).toHaveAttribute(
        "href",
        "https://www.blsdb.de",
      );

      await page.getByRole("button", { name: "English" }).click();
      await expect(attribution).toHaveText(
        "Nutrient values: Max Rubner-Institut, Bundeslebensmittelschlüssel (BLS), Version 4.0, as an extract, CC BY 4.0",
      );
    });
  }
});

// toHaveText normalizes whitespace, so stray template spaces need their own check.
test("footer texts carry no stray whitespace", async ({ page }) => {
  await page.goto("/");
  const texts = await page.locator("footer p, footer a").allTextContents();
  for (const text of texts) expect(text).not.toMatch(/^\s|\s$|\s{2}/);
});

test("switching the language keeps the path and survives a reload", async ({ page }) => {
  await openReady(page, "/privacy");
  await expect(page.locator("html")).toHaveAttribute("lang", "de-DE");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Datenschutzerklärung");

  await page.getByRole("button", { name: "English" }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en-GB");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy policy");
  await expect(page).toHaveTitle("Privacy policy | Nutrition Kitchen");

  await page.reload();
  await waitForHydration(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Privacy policy");
  await expect(page.getByRole("button", { name: "English" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test.describe("an English browser", () => {
  test.use({ locale: "en-GB" });

  test("gets English without a redirect", async ({ page }) => {
    const response = await page.goto("/imprint");
    expect(response?.request().redirectedFrom()).toBeNull();
    await expect(page).toHaveURL(/\/imprint$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Legal notice");
  });
});

test("the sources page cites every source", async ({ page }) => {
  await page.goto("/sources");
  await expect(page.getByText("DOI: 10.25826/Data20251217-134202-0")).toBeVisible();
  await expect(page.getByText("Open Government Licence v3.0")).toBeVisible();
});

// The privacy page promises that no third party is contacted.
test("no page loads anything from another host", async ({ page, baseURL }) => {
  const foreign: string[] = [];
  page.on("request", (request) => {
    if (!request.url().startsWith(baseURL!)) foreign.push(request.url());
  });
  for (const path of pages) await page.goto(path, { waitUntil: "networkidle" });
  expect(foreign).toEqual([]);
});

test("legal pages name the operator and hold no placeholders", async ({ page }) => {
  for (const language of ["Deutsch", "English"]) {
    for (const path of ["/imprint", "/privacy"]) {
      await openReady(page, path);
      await page.getByRole("button", { name: language }).click();
      const article = page.locator("article");
      await expect(article).toContainText("Weickenricht 25");
      await expect(article).not.toContainText("[");
    }
  }
});
