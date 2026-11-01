import { existsSync } from "node:fs";
import Database from "better-sqlite3";
import sharp from "sharp";
import { expect, test, type Page } from "@playwright/test";
import { signInAs } from "./auth";
import { rolls } from "./draft";
import { openReady } from "./ready";

// The e2e server's own database and pictures (see playwright.config.ts and $env.e2e).
const databasePath = ".data/e2e/nutrition-kitchen.sqlite";
const picturePath = (name: string) => `.data/e2e/pictures/${name}`;

function rowsOf(userId: number) {
  const db = new Database(databasePath, { readonly: true, fileMustExist: true });
  try {
    const count = (sql: string) => (db.prepare(sql).get(userId) as { n: number }).n;
    return {
      users: count("select count(*) as n from users where id = ?"),
      recipes: count("select count(*) as n from recipes where user_id = ?"),
      ingredients: count(
        "select count(*) as n from recipe_ingredients where recipe_id in (select id from recipes where user_id = ?)",
      ),
    };
  } finally {
    db.close();
  }
}

async function saveWithPhoto(page: Page, title: string) {
  const created = await page.request.post("/api/recipes", {
    data: { title, instructions: "", rows: rolls.rows, options: rolls.options },
  });
  const { id } = (await created.json()) as { id: number };
  const buffer = await sharp({
    create: { width: 40, height: 30, channels: 3, background: "#c98a3e" },
  })
    .png()
    .toBuffer();
  const { image } = (await (
    await page.request.put(`/api/recipes/${id}/image`, {
      multipart: { picture: { name: "p.png", mimeType: "image/png", buffer } },
    })
  ).json()) as { image: string };
  return { id, image };
}

test("signing out ends the session everywhere, also for a copied cookie", async ({
  page,
  browser,
}) => {
  await signInAs(page, "Flo Tester", "me");
  const copied = await page.context().cookies();
  const other = await browser.newContext();
  await other.addCookies(copied);
  expect((await other.request.get("/api/me")).status()).toBe(200);

  await openReady(page, "/");
  await page.getByRole("button", { name: "Konto von Flo Tester" }).click();
  await page.getByRole("menuitem", { name: "Abmelden" }).click();
  await expect(page.getByRole("link", { name: "Anmelden", exact: true })).toBeVisible();

  expect((await other.request.get("/api/me")).status()).toBe(401);
  // Signing in again works as before.
  await signInAs(page, "Flo Tester", "me");
  expect((await page.request.get("/api/me")).status()).toBe(200);
  await other.close();
});

test("an old cookie cannot sign its owner out elsewhere", async ({ page, browser }) => {
  await signInAs(page, "Flo Tester", "me");
  const before = await page.context().cookies();
  expect((await page.request.post("/api/logout")).status()).toBe(204);
  await signInAs(page, "Flo Tester", "me");

  // Logout first: any other request with the stale cookie would already clear it.
  const stale = await browser.newContext();
  await stale.addCookies(before);
  await stale.request.post("/api/logout");
  expect((await page.request.get("/api/me")).status()).toBe(200);
  await stale.close();
});

test("deleting the account leaves nothing of the user, and copies of others stay", async ({
  page,
  browser,
}) => {
  const me = await signInAs(page, "Flo Tester", "me");
  const kept = await saveWithPhoto(page, "Geteilt und weg");
  const plain = await saveWithPhoto(page, "Nur weg");
  const { slug } = (await (await page.request.put(`/api/recipes/${kept.id}/share`)).json()) as {
    slug: string;
  };

  const visitor = await browser.newContext();
  const visitorPage = await visitor.newPage();
  const friend = await signInAs(visitorPage, "Friend", "friend");
  expect((await visitorPage.request.post(`/api/shared/${slug}/copy`)).status()).toBe(201);
  const [copy] = (await (await visitorPage.request.get("/api/recipes")).json()) as {
    image: string;
  }[];

  expect(rowsOf(me.id)).toEqual({ users: 1, recipes: 2, ingredients: 8 });
  expect(existsSync(picturePath(kept.image))).toBe(true);
  const cookie = await page.context().cookies();

  await openReady(page, "/");
  await page.getByRole("button", { name: "Konto von Flo Tester" }).click();
  await page.getByRole("menuitem", { name: "Konto löschen" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("endgültig gelöscht");
  await dialog.getByRole("button", { name: "Konto löschen" }).click();
  await expect(page.getByText("Ihr Konto ist gelöscht.", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Anmelden", exact: true })).toBeVisible();

  expect(rowsOf(me.id)).toEqual({ users: 0, recipes: 0, ingredients: 0 });
  for (const image of [kept.image, plain.image]) {
    expect(existsSync(picturePath(image)), image).toBe(false);
    expect((await page.request.get(`/pictures/${image}`)).status()).toBe(404);
  }
  expect((await page.request.get(`/api/shared/${slug}`)).status()).toBe(404);

  // The cookie from before the deletion opens nothing.
  const old = await browser.newContext();
  await old.addCookies(cookie);
  expect((await old.request.get("/api/me")).status()).toBe(401);
  expect((await old.request.get("/api/recipes")).status()).toBe(401);
  await old.close();

  // The friend's copy is theirs: still there, photo included.
  expect(rowsOf(friend.id).recipes).toBe(1);
  expect((await visitorPage.request.get(`/pictures/${copy!.image}`)).status()).toBe(200);
  await visitor.close();
});

test("cancelling the question deletes nothing", async ({ page }) => {
  const me = await signInAs(page, "Flo Tester", "me");
  await openReady(page, "/");
  await page.getByRole("button", { name: "Konto von Flo Tester" }).click();
  await page.getByRole("menuitem", { name: "Konto löschen" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Abbrechen" }).click();
  expect(rowsOf(me.id).users).toBe(1);
  expect((await page.request.get("/api/me")).status()).toBe(200);
});

test("every cookie the app sets is named in the privacy policy", async ({ page, browser }) => {
  await signInAs(page, "Owner", "owner");
  const { id } = await saveWithPhoto(page, "Für die Cookies");
  const { slug } = (await (await page.request.put(`/api/recipes/${id}/share`)).json()) as {
    slug: string;
  };
  const visitor = await browser.newContext();
  const visitorPage = await visitor.newPage();
  await openReady(visitorPage, `/r/${slug}`);
  await visitorPage.getByRole("button", { name: "English" }).click();
  await visitorPage.getByRole("button", { name: "Sign in to copy" }).click();
  await expect(visitorPage).toHaveURL(/\/login$/);

  const names = new Set(
    [...(await page.context().cookies()), ...(await visitor.cookies())].map(({ name }) => name),
  );
  expect([...names].sort()).toEqual(["locale", "login-return", "nuxt-auth-session"]);
  for (const locale of ["de", "en"]) {
    await visitor.addCookies([{ name: "locale", value: locale, url: visitorPage.url() }]);
    await openReady(visitorPage, "/privacy");
    const text = await visitorPage.locator("main").innerText();
    for (const name of names) expect(text, `${name} (${locale})`).toContain(name);
  }
  await visitor.close();
});
