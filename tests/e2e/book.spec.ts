import sharp from "sharp";
import { expect, test, type Page } from "@playwright/test";
import { signInAs } from "./auth";
import { rolls, seedDraft } from "./draft";
import { openReady, waitForHydration } from "./ready";

const nb = (text: string) => text.replace(/(\d) (kJ|kcal|g|%)/g, "$1 $2");
const bar = (page: Page) => page.getByTestId("recipe-bar");

async function saveAs(page: Page, title: string) {
  await bar(page).getByRole("button", { name: "Speichern" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: /^Titel/ }).fill(title);
  await dialog.getByRole("button", { name: "Speichern" }).click();
  await expect(dialog).toBeHidden();
}

const photo = () =>
  sharp({ create: { width: 64, height: 48, channels: 3, background: "#f2b705" } })
    .png()
    .toBuffer();

test("signed out, saving asks to sign in", async ({ page }) => {
  await seedDraft(page, rolls);
  await openReady(page, "/");
  await expect(bar(page).getByRole("link", { name: "Zum Speichern anmelden" })).toHaveAttribute(
    "href",
    "/login",
  );
});

test("the book is for signed-in users only", async ({ page }) => {
  await openReady(page, "/book");
  await expect(page).toHaveURL(/\/login$/);
});

test("a saved recipe is in the book with its energy, and saving again updates it", async ({
  page,
}) => {
  await signInAs(page);
  await seedDraft(page, rolls);
  await openReady(page, "/");
  await saveAs(page, "Brötchen");
  await expect(page.getByText("Gespeichert.", { exact: true })).toBeVisible();
  await expect(bar(page)).toContainText("Rezept: Brötchen");

  await page.getByRole("textbox", { name: /^Menge von Speisesalz/ }).fill("25");
  await bar(page).getByRole("button", { name: "Speichern" }).click();
  await expect(page.getByRole("dialog").getByRole("textbox", { name: /^Titel/ })).toHaveValue(
    "Brötchen",
  );
  await page.getByRole("dialog").getByRole("button", { name: "Speichern" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();

  await page.goto("/book");
  await waitForHydration(page);
  const entries = page.getByTestId("book-entry");
  await expect(entries).toHaveCount(1);
  await expect(entries.first()).toContainText("Brötchen");
  await expect(entries.first()).toContainText(nb("kJ / "));
  await expect(entries.first()).toContainText("pro 100 g");
});

test("a reload goes on editing the saved recipe", async ({ page }) => {
  await signInAs(page);
  await seedDraft(page, rolls);
  await openReady(page, "/");
  await saveAs(page, "Fladen");
  await page.reload();
  await waitForHydration(page);
  await expect(bar(page)).toContainText("Rezept: Fladen");
});

test("a photo is checked by content, stored as WebP and shown in the book", async ({ page }) => {
  await signInAs(page);
  await seedDraft(page, rolls);
  await openReady(page, "/");
  await saveAs(page, "Mit Foto");

  await bar(page).getByRole("button", { name: "Speichern" }).click();
  const dialog = page.getByRole("dialog");
  // A text file named like a photo is refused.
  await dialog.locator('input[type="file"]').setInputFiles({
    name: "photo.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from("MZ no picture"),
  });
  await dialog.getByRole("button", { name: "Speichern" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Nur Fotos als JPEG, PNG oder WebP.");

  await dialog
    .locator('input[type="file"]')
    .setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: await photo() });
  await dialog.getByRole("button", { name: "Speichern" }).click();
  await expect(dialog).toBeHidden();

  await page.goto("/book");
  await waitForHydration(page);
  const image = page.getByTestId("book-entry").locator("img");
  const src = await image.getAttribute("src");
  expect(src).toMatch(/^\/pictures\/[A-Za-z0-9_-]{16}\.webp$/);
  const response = await page.request.get(src!);
  expect(response.headers()["content-type"]).toBe("image/webp");
});

test("a deleted recipe leaves the book and takes its photo along", async ({ page }) => {
  await signInAs(page);
  await seedDraft(page, rolls);
  await openReady(page, "/");
  await saveAs(page, "Weg damit");
  const { id } = (await (await page.request.get("/api/recipes")).json())[0] as { id: number };
  await page.request.put(`/api/recipes/${id}/image`, {
    multipart: { picture: { name: "p.png", mimeType: "image/png", buffer: await photo() } },
  });
  const { image } = (await (await page.request.get(`/api/recipes/${id}`)).json()) as {
    image: string;
  };

  await page.goto("/book");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Weg damit löschen" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Löschen" }).click();
  await expect(page.getByText("Noch keine Rezepte.")).toBeVisible();
  expect((await page.request.get(`/pictures/${image}`)).status()).toBe(404);
});

test("opening from the book puts the recipe back into the builder", async ({ page }) => {
  await signInAs(page);
  await seedDraft(page, rolls);
  await openReady(page, "/");
  await saveAs(page, "Zum Öffnen");
  await bar(page).getByRole("button", { name: "Neues Rezept" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Neues Rezept" }).click();
  await expect(page.locator("li.ingredient-row")).toHaveCount(0);

  await page.goto("/book");
  await waitForHydration(page);
  await page.getByRole("button", { name: "Zum Öffnen öffnen" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("li.ingredient-row")).toHaveCount(4);
  await expect(bar(page)).toContainText("Rezept: Zum Öffnen");
});

test("a recipe of someone else is not found, and the api checks what it gets", async ({
  page,
  browser,
}) => {
  await signInAs(page, "Owner", "owner");
  const created = await page.request.post("/api/recipes", {
    data: {
      title: "Privat",
      instructions: "",
      rows: [{ code: "C214200", amount: 100 }],
      options: rolls.options,
    },
  });
  expect(created.status()).toBe(201);
  const { id } = (await created.json()) as { id: number };

  const stranger = await browser.newContext();
  const strangerPage = await stranger.newPage();
  await signInAs(strangerPage, "Stranger", "stranger");
  for (const request of [
    strangerPage.request.get(`/api/recipes/${id}`),
    strangerPage.request.put(`/api/recipes/${id}`, {
      data: {
        title: "Mine",
        instructions: "",
        rows: [{ code: "C214200", amount: 1 }],
        options: rolls.options,
      },
    }),
    strangerPage.request.delete(`/api/recipes/${id}`),
  ]) {
    expect((await request).status()).toBe(404);
  }
  expect(await (await strangerPage.request.get("/api/recipes")).json()).toEqual([]);
  await stranger.close();

  for (const data of [
    { title: "", instructions: "", rows: [{ code: "C214200", amount: 1 }], options: rolls.options },
    { title: "X", instructions: "", rows: [], options: rolls.options },
    { title: "X", instructions: "", rows: [{ code: "../etc", amount: 1 }], options: rolls.options },
    {
      title: "X",
      instructions: "",
      rows: [{ code: "C214200", amount: -1 }],
      options: rolls.options,
    },
  ]) {
    expect((await page.request.post("/api/recipes", { data })).status(), JSON.stringify(data)).toBe(
      400,
    );
  }
  expect((await page.request.get("/api/recipes/abc")).status()).toBe(400);
  expect((await page.request.get(`/api/recipes/${id}`)).status()).toBe(200);
});
