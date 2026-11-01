import type { Page } from "@playwright/test";

type Custom = { name: string; per100g: Record<string, string | null> };

type Draft = {
  rows: (({ code: string } | { custom: Custom }) & { amount: number | null })[];
  options?: { pieceWeight: number | null; voluntary: string[]; referenceIntake: boolean };
};

/** The bread rolls of the nutrition README: 600 g water less 180 g baking loss, 60 g pieces. */
export const rolls: Draft = {
  rows: [
    { code: "C214200", amount: 1000 },
    { code: "N110000", amount: 420 },
    { code: "R459000", amount: 40 },
    { code: "R111000", amount: 20 },
  ],
  options: { pieceWeight: 60, voluntary: [], referenceIntake: false },
};

/** Leaves a draft as an earlier visit would have, before any script of the page runs. */
export async function seedDraft(page: Page, draft: Draft) {
  await page.addInitScript(
    (text) => {
      if (sessionStorage.getItem("seeded")) return;
      sessionStorage.setItem("seeded", "1");
      localStorage.setItem("nutrition-kitchen:draft", text);
    },
    JSON.stringify({ version: 1, ...draft }),
  );
}
