import { expect, test } from "@playwright/test";

test("home page renders with the theme applied", async ({ page }) => {
  await page.goto("/");
  const title = page.getByRole("heading", { level: 1 });
  await expect(title).toHaveText("Rezept eingeben, Nährwerte ablesen.");
  await expect(title).toHaveCSS("font-family", /^"?Atkinson Hyperlegible Next"?,/);
  await expect(page.getByRole("button", { name: "Deutsch" })).toHaveCSS(
    "background-color",
    "rgb(42, 48, 42)",
  );
});
