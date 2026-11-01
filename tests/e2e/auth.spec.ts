import { expect, test } from "@playwright/test";
import { signInAs } from "./auth";
import { openReady } from "./ready";

test("signed out, the header offers to sign in and the account api refuses", async ({ page }) => {
  await openReady(page, "/");
  await page.getByRole("link", { name: "Anmelden", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("link", { name: "Mit Google anmelden" })).toHaveAttribute(
    "href",
    "/auth/google",
  );
  expect((await page.request.get("/api/me")).status()).toBe(401);
});

test("signed in, the header shows who it is, and signing out ends it", async ({ page }) => {
  const user = await signInAs(page);
  await openReady(page, "/");
  const menu = page.getByRole("button", { name: "Konto von Flo Tester" });
  await expect(menu).toBeVisible();
  await expect(menu).toContainText("FT");
  expect(await (await page.request.get("/api/me")).json()).toEqual({
    id: user.id,
    name: "Flo Tester",
    provider: "google",
  });

  await menu.click();
  await page.getByRole("menuitem", { name: "Abmelden" }).click();
  await expect(page.getByRole("link", { name: "Anmelden", exact: true })).toBeVisible();
  expect((await page.request.get("/api/me")).status()).toBe(401);
});

test("a second login is the same user, under the name the provider gives now", async ({ page }) => {
  const first = await signInAs(page, "Old Name", "same");
  const again = await signInAs(page, "New Name", "same");
  expect(again).toEqual({ ...first, name: "New Name" });
});

test("Bluesky asks for the handle and passes it on", async ({ page }) => {
  let asked = "";
  await page.route("**/auth/bluesky?**", async (route) => {
    asked = new URL(route.request().url()).searchParams.get("handle") ?? "";
    await route.fulfill({ status: 200, contentType: "text/plain", body: "bluesky" });
  });
  await openReady(page, "/login");
  await page.getByRole("button", { name: "Mit Bluesky anmelden" }).click();
  await expect(page.getByText("Bitte Ihren Bluesky-Namen eingeben.")).toBeVisible();

  await page.getByRole("textbox", { name: "Ihr Bluesky-Name" }).fill("@flo.bsky.social");
  await page.getByRole("button", { name: "Mit Bluesky anmelden" }).click();
  await expect.poll(() => asked).toBe("flo.bsky.social");
});

test("a failed login says so on the login page", async ({ page }) => {
  await openReady(page, "/login?failed=google");
  await expect(page.getByText("Die Anmeldung mit Google hat nicht geklappt.")).toBeVisible();
});

test("the login page knows a signed-in user", async ({ page }) => {
  await signInAs(page);
  await openReady(page, "/login");
  await expect(page.getByText("Sie sind angemeldet als Flo Tester.")).toBeVisible();
});
