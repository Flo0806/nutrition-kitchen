import { calculateNutrition } from "@thereforejs/nutrition";
import { de } from "@thereforejs/nutrition/locales";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { seedDraft } from "./draft";
import { openReady } from "./ready";

// A bakery improver as its supplier sheet prints it; sugars are not stated.
const sheet = [
  ["Fett", "0,4"],
  ["davon: gesättigte Fettsäuren", "0,08"],
  ["Kohlenhydrate", "12,5"],
  ["Eiweiß", "40,2"],
  ["Salz", "1,25"],
] as const;

// The name is required, so its accessible name carries the asterisk ("Name *").
const field = (dialog: Locator, label: string) =>
  dialog.getByRole("textbox", label === "Name" ? { name: /^Name/ } : { name: label, exact: true });

async function fillSheet(page: Page, name: string) {
  const dialog = page.getByRole("dialog");
  await field(dialog, "Name").fill(name);
  for (const [label, value] of sheet) await field(dialog, label).fill(value);
  return dialog;
}

test.beforeEach(async ({ page }) => {
  await openReady(page, "/");
});

test("a supplier sheet becomes a row the label calculates with", async ({ page }) => {
  await page.getByRole("button", { name: "Eigener Rohstoff" }).click();
  const dialog = await fillSheet(page, "Backmittel");
  await dialog.getByRole("button", { name: "Übernehmen" }).click();

  await expect(dialog).toBeHidden();
  const grams = page.getByRole("textbox", { name: "Menge von Backmittel in Gramm" });
  await expect(grams).toBeFocused();
  await page.keyboard.type("30");

  // The library is the oracle: the same sheet, calculated directly.
  const { per100g } = calculateNutrition(
    {
      ingredients: [
        {
          amount: 30,
          per100g: {
            fat: "0.4",
            saturates: "0.08",
            carbohydrate: "12.5",
            sugars: null,
            protein: "40.2",
            salt: "1.25",
            fibre: null,
          },
        },
      ],
    },
    { locales: [de] },
  );
  const label = page.getByTestId("label");
  await expect(label.locator("tbody tr", { hasText: "Eiweiß" })).toContainText(
    per100g.protein.text["de-DE"]!,
  );
  await expect(label.locator("tbody tr", { hasText: "Energie" })).toContainText(
    per100g.energy.kJ.text["de-DE"]!,
  );
  await expect(page.locator("li.ingredient-row").getByTestId("row-note")).toContainText(
    "Es fehlen Werte für Zucker",
  );
});

test("the library's refusal stands at the field it concerns", async ({ page }) => {
  await page.getByRole("button", { name: "Eigener Rohstoff" }).click();
  const dialog = await fillSheet(page, "Backmittel");
  await field(dialog, "davon: Zucker").fill("35");
  await dialog.getByRole("button", { name: "Übernehmen" }).click();

  await expect(dialog).toBeVisible();
  await expect(field(dialog, "davon: Zucker")).toHaveAttribute("aria-invalid", "true");
  await expect(dialog.getByText("Mehr Zucker als Kohlenhydrate.")).toBeVisible();
});

test("a name and numbers are required, a decimal comma is fine", async ({ page }) => {
  await page.getByRole("button", { name: "Eigener Rohstoff" }).click();
  const dialog = page.getByRole("dialog");
  await field(dialog, "Fett").fill("viel");
  await dialog.getByRole("button", { name: "Übernehmen" }).click();
  await expect(dialog.getByText("Bitte einen Namen eingeben.")).toBeVisible();
  await expect(dialog.getByText("Bitte eine Zahl eingeben, zum Beispiel 12,5.")).toBeVisible();
});

test("a search that finds nothing fitting offers the raw material with its name", async ({
  page,
}) => {
  const search = page.getByRole("combobox", { name: "Zutat suchen" });
  await search.fill("Backmittel");
  await page.getByRole("option", { name: "„Backmittel“ als eigenen Rohstoff anlegen" }).click();
  await expect(field(page.getByRole("dialog"), "Name")).toHaveValue("Backmittel");
});

test("cancelling adds nothing and gives the focus back", async ({ page }) => {
  const open = page.getByRole("button", { name: "Eigener Rohstoff" });
  await open.click();
  await fillSheet(page, "Backmittel");
  await page.getByRole("dialog").getByRole("button", { name: "Abbrechen" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator("li.ingredient-row")).toHaveCount(0);
  await expect(open).toBeFocused();
});

test("a raw material can be edited and survives a reload", async ({ page }) => {
  await seedDraft(page, {
    rows: [
      {
        custom: {
          name: "Backmittel",
          per100g: {
            fat: "0.4",
            saturates: "0.08",
            carbohydrate: "12.5",
            sugars: null,
            protein: "40.2",
            salt: "1.25",
            fibre: null,
          },
        },
        amount: 30,
      },
    ],
  });
  await openReady(page, "/");
  await page.getByRole("button", { name: "Backmittel bearbeiten" }).click();
  const dialog = page.getByRole("dialog");
  await expect(field(dialog, "Eiweiß")).toHaveValue("40,2");
  await field(dialog, "Name").fill("Backmittel Spezial");
  await field(dialog, "davon: Zucker").fill("2");
  await dialog.getByRole("button", { name: "Speichern" }).click();

  const row = page.locator("li.ingredient-row");
  await expect(row.locator("p.font-bold")).toHaveText("Backmittel Spezial");
  await expect(row.getByRole("textbox", { name: /in Gramm$/ })).toHaveValue("30");
  await expect(row.getByTestId("row-note")).not.toContainText("Zucker");

  await page.reload();
  await expect(row.locator("p.font-bold")).toHaveText("Backmittel Spezial");
});
