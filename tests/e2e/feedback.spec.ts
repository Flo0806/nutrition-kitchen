import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { openReady } from "./ready";

// The e2e server writes reports here instead of sending them (playwright.config.ts).
const outbox = () => {
  try {
    return readFileSync(".data/e2e/outbox.ndjson", "utf8")
      .split("\n")
      .filter(Boolean)
      .map(
        (line) =>
          JSON.parse(line) as { to: string; subject: string; text: string; replyTo?: string },
      );
  } catch {
    return [];
  }
};

// A word of its own per test, browser and repeat, so parallel tests find their own mail. Its digits
// keep the search from reading it as a typo of a real food.
const unique = () => `Quorx${test.info().testId.slice(0, 8)}${test.info().repeatEachIndex}`;

// The check starts by itself once someone types in the form; a click starts it otherwise.
async function proveHuman(page: Page) {
  const done = page.getByRole("checkbox", { name: "Überprüft" });
  if (!(await done.isVisible())) {
    const robot = page.getByRole("checkbox", { name: /Roboter/ });
    if (await robot.isVisible()) await robot.check();
  }
  await expect(done).toBeChecked({ timeout: 30_000 });
}

// The reports count per client address; every test is a client of its own.
const address = () =>
  `10.${test.info().workerIndex % 250}.${test.info().repeatEachIndex % 250}.${(test.info().testId.charCodeAt(0) % 200) + 1}`;

test("a search that finds nothing leads to a report, filled in, that arrives", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-forwarded-for": address() });
  const word = unique();
  await openReady(page, "/");
  await page.getByRole("combobox", { name: "Zutat suchen" }).fill(word);
  await page.getByRole("option", { name: `„${word}“ nicht dabei? Melden` }).click();
  await expect(page).toHaveURL(new RegExp(`/feedback\\?kind=missingFood&search=${word}`));
  await expect(page.getByRole("textbox", { name: /Ihre Nachricht/ })).toHaveValue(
    `Die Suche nach „${word}“ findet nicht, was ich suche:`,
  );

  await page.getByRole("textbox", { name: /Ihre Nachricht/ }).fill(`${word} gibt es im Laden.`);
  await page.getByRole("textbox", { name: /E-Mail/ }).fill("cook@example.test");
  await proveHuman(page);
  await page.getByRole("button", { name: "Senden" }).click();
  await expect(page.getByText("Danke! Ihre Meldung ist angekommen.")).toBeVisible();

  const mail = outbox().find((entry) => entry.text.includes(word));
  expect(mail).toMatchObject({
    to: "reports@example.test",
    subject: `[Nutrition Kitchen] Lebensmittel fehlt: „${word}“`,
    replyTo: "cook@example.test",
  });
  expect(mail?.text).toContain(`${word} gibt es im Laden.`);
});

test("the form asks for a message and for the robot check before it sends", async ({ page }) => {
  await openReady(page, "/feedback");
  await page.getByRole("button", { name: "Senden" }).click();
  await expect(page.getByText("Bitte schreiben Sie kurz, worum es geht.")).toBeVisible();
  await page.getByRole("textbox", { name: /Ihre Nachricht/ }).fill("Eine Idee für später.");
  await page.getByRole("button", { name: "Senden" }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Bitte bestätigen Sie kurz, dass Sie kein Roboter sind.",
  );
});

test("without a solved check or with the trap filled nothing is sent", async ({ request }) => {
  const headers = { "x-forwarded-for": address() };
  const word = `Trap${test.info().project.name.length}${Date.now()}`;
  const body = { kind: "idea", message: `${word} message`, altcha: "forged" };
  expect((await request.post("/api/feedback", { data: body, headers })).status()).toBe(400);
  // A bot that fills the hidden field is thanked, and nothing goes out.
  const trapped = await request.post("/api/feedback", {
    data: { ...body, website: "spam.example" },
    headers,
  });
  expect(trapped.status()).toBe(200);
  expect(outbox().some((entry) => entry.text.includes(word))).toBe(false);
  // The address the reports go to is in no page.
  const html = await (await request.get("/feedback")).text();
  expect(html).not.toContain("reports@example.test");
});

test("one address may report five times an hour; a forged first entry changes nothing", async ({
  request,
}) => {
  const client = `192.0.2.${(test.info().workerIndex % 200) + test.info().repeatEachIndex + 1}`;
  const body = { kind: "idea", message: "Noch eine Idee.", altcha: "forged" };
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) {
    // A client may send its own X-Forwarded-For; the proxy appends the real address last.
    const headers = { "x-forwarded-for": `198.51.100.${i}, ${client}` };
    statuses.push((await request.post("/api/feedback", { data: body, headers })).status());
  }
  expect(statuses).toEqual([400, 400, 400, 400, 400, 429]);
});
