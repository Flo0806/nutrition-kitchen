import { expect, test, type Page } from "@playwright/test";
import { C214200, N110000, R111000, R459000 } from "@thereforejs/foods";
import { calculateNutrition } from "@thereforejs/nutrition";
import { de } from "@thereforejs/nutrition/locales";
import { rolls, seedDraft } from "./draft";
import { openReady } from "./ready";

const label = (page: Page) => page.getByTestId("label");
// Each row of the label as its cells, the energy lines joined: ["Energie", "1016 kJ / 240 kcal", ...].
const labelRows = (page: Page) =>
  label(page)
    .locator("tbody tr")
    .evaluateAll((rows) =>
      rows.map((row) =>
        [...row.children].map((cell) =>
          [...cell.querySelectorAll("span span")].length > 0
            ? [...cell.querySelectorAll("span span")].map((line) => line.textContent).join(" / ")
            : (cell.textContent ?? "").trim(),
        ),
      ),
    );
// The label replaces its loading note once the values are in, which moves everything below it:
// interact only after that, or a click lands where a control was a moment ago.
async function openWith(page: Page, draft: Parameters<typeof seedDraft>[1]) {
  await seedDraft(page, draft);
  await openReady(page, "/");
  await expect(label(page)).toBeVisible();
}

const nb = (text: string) => text.replace(/(\d) (kJ|kcal|g|%)/g, "$1 $2");
const table = (rows: string[][]) => rows.map((row) => row.map(nb));

test("the bread rolls give the README declaration, in German and in English", async ({ page }) => {
  await openWith(page, rolls);

  await expect(label(page).locator("caption")).toHaveText("Nährwerte");
  await expect
    .poll(() => labelRows(page))
    .toEqual(
      table([
        ["Energie", "1016 kJ / 240 kcal", "609 kJ / 144 kcal"],
        ["Fett", "0,8 g", "<0,5 g"],
        ["davon: gesättigte Fettsäuren", "<0,1 g", "<0,1 g"],
        ["Kohlenhydrate", "48 g", "29 g"],
        ["davon: Zucker", "<0,5 g", "<0,5 g"],
        ["Eiweiß", "8,5 g", "5,1 g"],
        ["Salz", "1,3 g", "0,78 g"],
      ]),
    );

  await page.getByRole("button", { name: "Etikett auf Englisch" }).click();
  await expect(label(page).locator("caption")).toHaveText("Nutrition declaration");
  await expect(label(page)).toHaveAttribute("lang", "en-GB");
  await expect
    .poll(() => labelRows(page))
    .toEqual(
      table([
        ["energy", "1016 kJ / 240 kcal", "609 kJ / 144 kcal"],
        ["fat", "0.8 g", "<0.5 g"],
        ["of which saturates", "<0.1 g", "<0.1 g"],
        ["carbohydrate", "48 g", "29 g"],
        ["of which sugars", "<0.5 g", "<0.5 g"],
        ["protein", "8.5 g", "5.1 g"],
        ["salt", "1.3 g", "0.78 g"],
      ]),
    );
});

test("the label follows every keystroke", async ({ page }) => {
  await openWith(page, rolls);

  // The library is the oracle: the rolls with twice the salt, as it calculates them.
  const { per100g, perPiece } = calculateNutrition(
    {
      ingredients: [
        { amount: 1000, per100g: C214200.per100g },
        { amount: 420, per100g: N110000.per100g },
        { amount: 40, per100g: R459000.per100g },
        { amount: 40, per100g: R111000.per100g },
      ],
      pieceWeight: 60,
    },
    { locales: [de] },
  );

  await page.getByRole("textbox", { name: /^Menge von Speisesalz/ }).fill("40");
  await expect
    .poll(async () => (await labelRows(page))[6])
    .toEqual(["Salz", per100g.salt.text["de-DE"], perPiece?.salt.text["de-DE"]]);
});

test("the report speaks at the row it concerns", async ({ page }) => {
  await openWith(page, rolls);
  const yeast = page.locator("li.ingredient-row", { hasText: "Backhefe frisch" });
  await expect(yeast.getByTestId("row-note")).toHaveText(
    "Es fehlen Werte für mehrwertige Alkohole, Alkohol und organische Säuren. Die Energie ist ohne sie gerechnet.",
  );
  await expect(page.getByTestId("row-note")).toHaveCount(1);
});

test("a row without an amount is named, not silently left out", async ({ page }) => {
  await openWith(page, {
    rows: [...rolls.rows, { code: "Q630000", amount: null }],
    options: rolls.options,
  });
  await expect(page.getByText("Ohne Menge nicht mitgerechnet: Süßrahmbutter.")).toBeVisible();
});

test("a recipe of 0 g is refused with a sentence, not a label", async ({ page }) => {
  await seedDraft(page, { rows: [{ code: "C214200", amount: 0 }] });
  await openReady(page, "/");
  await expect(page.getByTestId("problems")).toHaveText(
    "Das Rezept wiegt 0 g. Geben Sie mindestens einer Zutat eine Menge.",
  );
  await expect(label(page)).toHaveCount(0);
});

test("percent of the reference intake adds a column and the statement", async ({ page }) => {
  await openWith(page, rolls);
  await page.getByRole("switch", { name: "Prozent der Referenzmenge zeigen" }).click();
  await expect(label(page).locator("thead")).toContainText("% RM*");
  await expect(label(page).locator("figcaption")).toHaveText(
    "* Referenzmenge für einen durchschnittlichen Erwachsenen (8 400 kJ/2 000 kcal)",
  );
});

test("voluntary nutrients and the piece weight change the label and survive a reload", async ({
  page,
}) => {
  await openWith(page, rolls);
  await page.getByRole("checkbox", { name: "Ballaststoffe" }).click();
  await page.getByRole("textbox", { name: "Gewicht pro Stück" }).fill("50");
  await expect(label(page).locator("thead")).toContainText(nb("pro Stück (50 g)"));
  await expect(label(page).locator("tbody")).toContainText("Ballaststoffe");

  await page.reload();
  await expect(label(page).locator("thead")).toContainText(nb("pro Stück (50 g)"));
  await expect(label(page).locator("tbody")).toContainText("Ballaststoffe");
});

test("copy as text puts the label on the clipboard", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async (text: string) => ((window as { copied?: string }).copied = text) },
    });
  });
  await openWith(page, rolls);
  await page.getByRole("button", { name: "Als Text kopieren" }).click();
  // Copying is asynchronous by contract.
  const read = () => page.evaluate(() => (window as { copied?: string }).copied ?? "");
  await expect.poll(read).not.toBe("");
  const copied = await read();
  expect(copied.split("\n")[0]).toBe("Nährwerte");
  expect(copied).toContain(nb("1016 kJ / 240 kcal"));
  await expect(
    page.getByText("Das Etikett ist in der Zwischenablage.", { exact: true }),
  ).toBeVisible();
});

test("printing shows the label alone", async ({ page }) => {
  await openWith(page, rolls);
  await page.emulateMedia({ media: "print" });
  await expect(label(page)).toBeVisible();
  for (const hidden of [
    page.getByRole("combobox", { name: "Zutat suchen" }),
    page.getByRole("button", { name: "Drucken" }),
    page.getByRole("switch"),
    page.getByRole("button", { name: "Deutsch" }),
    page.getByRole("link", { name: "Impressum" }),
  ]) {
    await expect(hidden).toBeHidden();
  }
  // Printed values pass the BLS data on, so its attribution goes with them (CC BY 4.0).
  await expect(page.getByTestId("attribution")).toBeVisible();
});

test.describe("looks", () => {
  test.skip(
    ({ browserName, isMobile }) => browserName !== "chromium" || isMobile,
    "one renderer for baselines",
  );

  test("the label", async ({ page }) => {
    await openWith(page, {
      ...rolls,
      options: { pieceWeight: 60, voluntary: ["fibre"], referenceIntake: true },
    });
    await expect(label(page)).toHaveScreenshot("label-de.png");
  });

  test("the printed page", async ({ page }) => {
    await openWith(page, rolls);
    await page.emulateMedia({ media: "print" });
    await expect(page).toHaveScreenshot("print-de.png", { fullPage: true });
  });
});
