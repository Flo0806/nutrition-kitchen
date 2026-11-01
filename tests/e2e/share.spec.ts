import sharp from "sharp";
import { expect, test, type Browser, type Page } from "@playwright/test";
import { signInAs } from "./auth";
import { rolls, seedDraft } from "./draft";
import { openReady, waitForHydration } from "./ready";

const photo = () =>
  sharp({ create: { width: 64, height: 48, channels: 3, background: "#2f7d4f" } })
    .png()
    .toBuffer();

/** A saved recipe of the signed-in user, with a photo. */
async function saveRolls(page: Page, title = "Geteilte Brötchen") {
  const created = await page.request.post("/api/recipes", {
    data: { title, instructions: "Kneten.\nBacken.", rows: rolls.rows, options: rolls.options },
  });
  const { id } = (await created.json()) as { id: number };
  await page.request.put(`/api/recipes/${id}/image`, {
    multipart: { picture: { name: "p.png", mimeType: "image/png", buffer: await photo() } },
  });
  return id;
}

/** Shares a recipe through the book's dialog and returns the link it shows. */
async function shareInBook(page: Page, title: string) {
  await openReady(page, "/book");
  await page.getByRole("button", { name: `${title} teilen` }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Link erstellen" }).click();
  const link = await dialog.getByRole("textbox", { name: "Link" }).inputValue();
  expect(link).toMatch(/^http:\/\/localhost:3101\/r\/[A-Za-z0-9_-]{12}$/);
  return { dialog, link };
}

async function visitor(browser: Browser) {
  const context = await browser.newContext();
  return { context, page: await context.newPage() };
}

test("a shared recipe is readable by anyone with its label, and ending the share ends the link", async ({
  page,
  browser,
}) => {
  await signInAs(page, "Owner Tester", "owner");
  await saveRolls(page);
  // The builder's label for the same recipe: the shared page must show exactly this.
  await seedDraft(page, rolls);
  await openReady(page, "/");
  const builderLabel = (await page.getByTestId("label").textContent()) ?? "";
  expect(builderLabel).toContain("Energie");

  const { dialog, link } = await shareInBook(page, "Geteilte Brötchen");
  await dialog.getByRole("button", { name: "Schließen" }).click();
  await expect(page.getByTestId("book-entry")).toContainText("Geteilt");

  const anonymous = await visitor(browser);
  const response = await anonymous.page.goto(link);
  expect(response?.status()).toBe(200);
  await waitForHydration(anonymous.page);
  const shared = anonymous.page;
  await expect(shared.getByRole("heading", { level: 1 })).toHaveText("Geteilte Brötchen");
  await expect(shared.getByTestId("shared-ingredients").getByRole("listitem")).toHaveCount(4);
  await expect(shared.getByTestId("shared-ingredients")).toContainText("Weizen Mehl, Type 550");
  await expect(shared.getByText("Backen.")).toBeVisible();
  const picture = await shared.locator("article img").getAttribute("src");
  expect(picture).toMatch(/^\/pictures\/[A-Za-z0-9_-]{16}\.webp$/);
  await expect(shared.getByTestId("label")).toHaveText(builderLabel);
  // Read only: no options to change, and nothing about who shared it.
  await expect(shared.getByRole("switch")).toHaveCount(0);
  await expect(shared.locator("body")).not.toContainText("Owner Tester");
  await expect(shared.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  // A link shared in a messenger shows the recipe's title.
  await expect(shared.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Geteilte Brötchen",
  );

  await page.getByRole("button", { name: "Geteilte Brötchen teilen" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Link beenden" }).click();
  await expect(
    page.getByRole("dialog").getByRole("button", { name: "Link erstellen" }),
  ).toBeVisible();

  const ended = await shared.goto(link);
  expect(ended?.status()).toBe(404);
  // The photo was seen under its name, so it moved: the owner keeps it, the old name is gone.
  expect((await shared.request.get(picture!)).status()).toBe(404);

  await expect(shared.getByRole("heading", { level: 1 })).toHaveText("Diese Seite gibt es nicht.");

  // Sharing again is a new link; the old one stays dead.
  await page.getByRole("dialog").getByRole("button", { name: "Link erstellen" }).click();
  const again = await page.getByRole("dialog").getByRole("textbox", { name: "Link" }).inputValue();
  expect(again).not.toBe(link);
  expect((await shared.goto(link))?.status()).toBe(404);
  expect((await shared.goto(again))?.status()).toBe(200);

  await page.getByRole("dialog").getByRole("button", { name: "Schließen" }).click();
  const moved = page.getByTestId("book-entry").locator("img");
  await expect(moved).not.toHaveAttribute("src", picture!);
  expect((await page.request.get((await moved.getAttribute("src"))!)).status()).toBe(200);
  await anonymous.context.close();
});

test("a signed-in visitor copies a shared recipe into their own book, with a photo of its own", async ({
  page,
  browser,
}) => {
  await signInAs(page, "Owner", "owner");
  const id = await saveRolls(page, "Zum Kopieren");
  const { link } = await shareInBook(page, "Zum Kopieren");

  const other = await visitor(browser);
  await signInAs(other.page, "Visitor", "visitor");
  await openReady(other.page, link);
  await other.page.getByRole("button", { name: "In mein Rezeptbuch kopieren" }).click();
  await expect(other.page).toHaveURL(/\/book$/);
  await expect(other.page.getByText("In Ihr Rezeptbuch kopiert.", { exact: true })).toBeVisible();
  const entry = other.page.getByTestId("book-entry");
  await expect(entry).toHaveCount(1);
  await expect(entry).toContainText("Zum Kopieren");
  // A copy is private, whatever the original is.
  await expect(entry).not.toContainText("Geteilt");

  const copied = await entry.locator("img").getAttribute("src");
  const original = (
    (await (await page.request.get(`/api/recipes/${id}`)).json()) as { image: string }
  ).image;
  expect(copied).not.toBe(`/pictures/${original}`);

  // The owner deletes the original: the copy keeps its photo.
  expect((await page.request.delete(`/api/recipes/${id}`)).status()).toBe(204);
  expect((await other.page.request.get(copied!)).status()).toBe(200);
  expect((await other.page.request.get(`/pictures/${original}`)).status()).toBe(404);
  await other.context.close();
});

test("signed out, copying asks to sign in and remembers where to come back to", async ({
  page,
  browser,
}) => {
  await signInAs(page, "Owner", "owner");
  await saveRolls(page, "Erst anmelden");
  const { link } = await shareInBook(page, "Erst anmelden");

  const anonymous = await visitor(browser);
  await openReady(anonymous.page, link);
  await anonymous.page.getByRole("button", { name: "Zum Kopieren anmelden" }).click();
  await expect(anonymous.page).toHaveURL(/\/login$/);
  const cookies = await anonymous.context.cookies();
  expect(cookies.find((cookie) => cookie.name === "login-return")?.value).toBe(
    encodeURIComponent(new URL(link).pathname),
  );
  await anonymous.context.close();
});

test("only the owner shares, and the shared api tells nothing but the recipe", async ({
  page,
  browser,
}) => {
  await signInAs(page, "Owner", "owner");
  const id = await saveRolls(page, "Nur meins");

  const other = await visitor(browser);
  await signInAs(other.page, "Stranger", "stranger");
  expect((await other.page.request.put(`/api/recipes/${id}/share`)).status()).toBe(404);

  const { slug } = (await (await page.request.put(`/api/recipes/${id}/share`)).json()) as {
    slug: string;
  };
  // Sharing twice keeps the link.
  expect(await (await page.request.put(`/api/recipes/${id}/share`)).json()).toEqual({ slug });
  expect((await other.page.request.delete(`/api/recipes/${id}/share`)).status()).toBe(404);

  const response = await other.page.request.get(`/api/shared/${slug}`);
  expect(response.status()).toBe(200);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(Object.keys(await response.json()).sort()).toEqual([
    "image",
    "instructions",
    "options",
    "rows",
    "title",
  ]);

  for (const bad of ["short", "AAAAAAAAAAAA", "..%2F..%2Fetc", `${slug}x`]) {
    expect((await other.page.request.get(`/api/shared/${bad}`)).status(), bad).toBe(404);
  }
  await other.context.close();

  const anonymous = await visitor(browser);
  expect((await anonymous.page.request.post(`/api/shared/${slug}/copy`)).status()).toBe(401);
  expect((await anonymous.page.request.put(`/api/recipes/${id}/share`)).status()).toBe(401);
  await anonymous.context.close();
});

test("a link that never existed is not found", async ({ page }) => {
  const response = await page.goto("/r/AAAAAAAAAAAA");
  expect(response?.status()).toBe(404);
  await waitForHydration(page);
  await page.getByRole("button", { name: "Zur Startseite" }).click();
  await expect(page).toHaveURL(/\/$/);
});
