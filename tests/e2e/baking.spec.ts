import { expect, test, type Page } from "@playwright/test";
import { rolls, seedDraft } from "./draft";
import { openReady } from "./ready";

// The README rolls as a baker types them: the water before baking.
const typed = {
  ...rolls,
  rows: rolls.rows.map((row) =>
    "code" in row && row.code === "N110000" ? { ...row, amount: 600 } : row,
  ),
};

const loss = (page: Page) => page.getByRole("textbox", { name: "Backverlust" });
const label = (page: Page) => page.getByTestId("label");
const waterRow = (page: Page) => page.locator("li.ingredient-row", { hasText: "Trinkwasser" });
const nb = (text: string) => text.replace(/(\d) (kJ|kcal|g|%)/g, "$1 $2");

test("600 g water and 180 g baking loss give the README rolls", async ({ page }) => {
  await seedDraft(page, typed);
  await openReady(page, "/");
  await expect(label(page)).toBeVisible();
  await loss(page).fill("180");

  await expect(waterRow(page).getByTestId("row-note")).toHaveText("Nach dem Backen: 420 g");
  await expect(page.getByTestId("after-baking")).toHaveText("Gewicht nach dem Backen1.480 g");
  await expect(label(page).locator("tbody tr").first()).toContainText(nb("1016 kJ"));
  await expect(label(page).locator("tbody tr", { hasText: "Salz" })).toContainText(nb("1,3 g"));

  await page.reload();
  await expect(loss(page)).toHaveValue("180");
  await expect(label(page).locator("tbody tr").first()).toContainText(nb("1016 kJ"));
});

test("without water the field waits for a water row", async ({ page }) => {
  await seedDraft(page, { rows: [{ code: "C214200", amount: 1000 }] });
  await openReady(page, "/");
  await expect(loss(page)).toBeDisabled();
  await expect(
    page.getByText("Für den Backverlust braucht das Rezept eine Zeile Wasser."),
  ).toBeVisible();
});

test("more loss than water is refused, not calculated", async ({ page }) => {
  await seedDraft(page, typed);
  await openReady(page, "/");
  await expect(label(page)).toBeVisible();
  await loss(page).fill("650");
  await expect(page.getByTestId("baking-problem")).toHaveText(
    "Der Backverlust (650 g) ist größer als das Wasser im Rezept (600 g).",
  );
  await expect(label(page)).toHaveCount(0);
  await expect(page.getByTestId("problems")).toContainText(
    "Der Backverlust passt nicht zum Wasser",
  );
});

test("a loss left after removing the water can still be cleared", async ({ page }) => {
  await seedDraft(page, {
    ...typed,
    options: { pieceWeight: 60, voluntary: [], referenceIntake: false, bakingLoss: 180 },
  });
  await openReady(page, "/");
  await page.getByRole("button", { name: "Trinkwasser entfernen" }).click();
  await expect(page.getByTestId("baking-problem")).toHaveText(
    "Für den Backverlust braucht das Rezept eine Zeile Wasser.",
  );
  await expect(loss(page)).toBeEnabled();
  await loss(page).fill("");
  await expect(label(page)).toBeVisible();
  await expect(loss(page)).toBeDisabled();
});
