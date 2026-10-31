import { expect, test, type Page } from "@playwright/test";
import { openReady, waitForHydration } from "./ready";

const search = (page: Page) => page.getByRole("combobox", { name: "Zutat suchen" });
const total = (page: Page) => page.getByTestId("total");
const rowNames = (page: Page) => page.locator("li.ingredient-row p.font-bold");

// Step by step: SortableJS needs several moves to start dragging, which dragTo does not send.
async function drag(page: Page, from: string | RegExp, to: string | RegExp) {
  const source = await page.getByRole("button", { name: from }).boundingBox();
  const target = await page.getByRole("button", { name: to }).boundingBox();
  if (!source || !target) throw new Error("drag handles not found");
  await page.mouse.move(source.x + source.width / 2, source.y + source.height / 2);
  await page.mouse.down();
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 12 });
  await page.mouse.up();
}

async function addDirect(page: Page, query: string, grams: string) {
  await search(page).fill(query);
  await search(page).press("Enter");
  await expect(page.getByRole("textbox", { name: /in Gramm$/ }).last()).toBeFocused();
  await page.keyboard.type(grams);
}

test.beforeEach(async ({ page }) => {
  await openReady(page, "/");
});

test("an everyday word with many foods shows a list and lets a human pick", async ({ page }) => {
  await search(page).fill("Mehl");
  const options = page.getByRole("option");
  await expect(options).toHaveCount(8);
  await expect(options.first()).toHaveText("Weizen Mehl, Type 405");

  await search(page).press("Enter");
  await expect(rowNames(page)).toHaveCount(0);

  await search(page).press("ArrowDown");
  await search(page).press("Enter");
  await expect(rowNames(page)).toHaveText(["Weizen Mehl, Type 550"]);
});

test("a single exact hit is taken on Enter and the label follows the typing", async ({ page }) => {
  await addDirect(page, "Butter", "250");
  await expect(rowNames(page)).toHaveText(["Süßrahmbutter"]);
  await expect(total(page)).toHaveText("Gesamt250 g");

  await page.keyboard.press("Enter");
  await expect(search(page)).toBeFocused();
});

test("grams take a decimal comma and refuse what is no number", async ({ page }) => {
  await addDirect(page, "Zucker", "12,5");
  await expect(total(page)).toHaveText("Gesamt12,5 g");

  const grams = page.getByRole("textbox", { name: /in Gramm$/ });
  await grams.fill("zwölf");
  await expect(grams).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByText("Bitte eine Zahl in Gramm eingeben")).toBeVisible();
  await expect(total(page)).toHaveText("Gesamt0 g");
});

test("steppers add and take ten grams", async ({ page }) => {
  await addDirect(page, "Butter", "100");
  const row = page.locator("li.ingredient-row");
  await row.getByRole("button", { name: "10 g mehr" }).click();
  await expect(total(page)).toHaveText("Gesamt110 g");
  await row.getByRole("button", { name: "10 g weniger" }).click();
  await row.getByRole("button", { name: "10 g weniger" }).click();
  await expect(total(page)).toHaveText("Gesamt90 g");
});

test("a reload keeps the recipe", async ({ page }) => {
  await addDirect(page, "Butter", "250");
  await addDirect(page, "Zucker", "120,5");
  await page.reload();
  await waitForHydration(page);
  await expect(rowNames(page)).toHaveText(["Süßrahmbutter", /^Zucker weiß/]);
  await expect(total(page)).toHaveText("Gesamt370,5 g");
});

test("a damaged draft from an earlier visit is dropped with a notice", async ({ page }) => {
  // Stored before any script of the page runs, as a visit from yesterday would have left it.
  await page.addInitScript(() => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    localStorage.setItem("nutrition-kitchen:draft", "{broken");
  });
  await openReady(page, "/");
  // Exact: the toast's screen reader announcement carries the same words with a prefix.
  const notice = "Der gespeicherte Entwurf war beschädigt und wurde verworfen.";
  await expect(page.getByText(notice, { exact: true })).toBeVisible();
  await expect(rowNames(page)).toHaveCount(0);
});

test("rows can be removed", async ({ page }) => {
  await addDirect(page, "Butter", "250");
  await addDirect(page, "Zucker", "100");
  await page.getByRole("button", { name: "Süßrahmbutter entfernen" }).click();
  await expect(rowNames(page)).toHaveText([/^Zucker weiß/]);
  await expect(total(page)).toHaveText("Gesamt100 g");
});

test("rows move with the keyboard", async ({ page }) => {
  await addDirect(page, "Butter", "250");
  await addDirect(page, "Zucker", "100");
  const handle = page.getByRole("button", { name: /^Zucker weiß.* verschieben$/ });
  await handle.focus();
  await page.keyboard.press("ArrowUp");
  await expect(rowNames(page)).toHaveText([/^Zucker weiß/, "Süßrahmbutter"]);
  await expect(handle).toBeFocused();
});

test("rows move by dragging the handle", async ({ page, isMobile }) => {
  test.skip(isMobile, "touch dragging is SortableJS's own; Playwright drives a mouse");
  await addDirect(page, "Butter", "250");
  await addDirect(page, "Zucker", "100");
  await drag(page, /^Zucker weiß.* verschieben$/, "Süßrahmbutter verschieben");
  await expect(rowNames(page)).toHaveText([/^Zucker weiß/, "Süßrahmbutter"]);
  await page.reload();
  await waitForHydration(page);
  await expect(rowNames(page)).toHaveText([/^Zucker weiß/, "Süßrahmbutter"]);
});

test("switching to English renames the rows and keeps the amounts", async ({ page }) => {
  await addDirect(page, "Zucker", "12,5");
  await page.getByRole("button", { name: "English" }).click();
  await expect(rowNames(page)).toHaveText([/^Sugar white/]);
  await expect(page.getByRole("textbox", { name: /in grams$/ })).toHaveValue("12.5");
  await expect(total(page)).toHaveText("Total12.5 g");
});
