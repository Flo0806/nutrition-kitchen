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

test("a photo upload without a declared length is refused before it is read", async ({
  page,
  baseURL,
}) => {
  await signInAs(page);
  const created = await page.request.post("/api/recipes", {
    data: { title: "Ohne Länge", instructions: "", rows: rolls.rows, options: rolls.options },
  });
  const { id } = (await created.json()) as { id: number };
  const cookie = (await page.context().cookies())
    .map(({ name, value }) => `${name}=${value}`)
    .join("; ");
  const form = new FormData();
  form.append("picture", new Blob([await photo()], { type: "image/png" }), "p.png");
  const body = new Response(form);
  // A stream has no length, so it goes out chunked: the server cannot know the size up front.
  const response = await fetch(new URL(`/api/recipes/${id}/image`, baseURL), {
    method: "PUT",
    headers: { cookie, "content-type": body.headers.get("content-type")! },
    body: body.body,
    duplex: "half",
  } as RequestInit);
  expect(response.status).toBe(411);
});

test("a book holds 75 recipes; the 76th is refused with a reason", async ({ page }) => {
  await signInAs(page);
  const data = {
    title: "Eins von vielen",
    instructions: "",
    rows: rolls.rows,
    options: rolls.options,
  };
  for (let i = 0; i < 75; i++) {
    expect((await page.request.post("/api/recipes", { data })).status()).toBe(201);
  }
  expect((await page.request.post("/api/recipes", { data })).status()).toBe(409);

  await seedDraft(page, rolls);
  await openReady(page, "/");
  await bar(page).getByRole("button", { name: "Speichern" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: /^Titel/ }).fill("Zu viel");
  await dialog.getByRole("button", { name: "Speichern" }).click();
  await expect(dialog.getByRole("alert")).toHaveText(
    "Ihr Rezeptbuch ist voll: höchstens 75 Rezepte. Löschen Sie eins, um Platz zu schaffen.",
  );
});

test("a photo of more than 100 megapixels is refused", async ({ page }) => {
  await signInAs(page);
  const created = await page.request.post("/api/recipes", {
    data: { title: "Bombe", instructions: "", rows: rolls.rows, options: rolls.options },
  });
  const { id } = (await created.json()) as { id: number };
  const bomb = await sharp({
    create: { width: 10_001, height: 10_000, channels: 3, background: "#fff" },
  })
    .png()
    .toBuffer();
  const response = await page.request.put(`/api/recipes/${id}/image`, {
    multipart: { picture: { name: "p.png", mimeType: "image/png", buffer: bomb } },
  });
  expect(response.status()).toBe(413);
});

test("changes from another site, sibling subdomains included, are refused", async ({ page }) => {
  await signInAs(page);
  const data = { title: "Fremd", instructions: "", rows: rolls.rows, options: rolls.options };
  for (const site of ["cross-site", "same-site"]) {
    const response = await page.request.post("/api/recipes", {
      data,
      headers: { "sec-fetch-site": site },
    });
    expect(response.status(), site).toBe(403);
  }
  const own = await page.request.post("/api/recipes", {
    data,
    headers: { "sec-fetch-site": "same-origin" },
  });
  expect(own.status()).toBe(201);
  expect(await (await page.request.get("/api/recipes")).json()).toHaveLength(1);
});
