import { expect, test } from "@playwright/test";

test("home page renders with the theme applied", async ({ page }) => {
  await page.goto("/");
  const title = page.getByRole("heading", { level: 1 });
  await expect(title).toHaveText("Nutrition Kitchen");
  await expect(title).toHaveCSS("color", "rgb(47, 122, 79)");
});
