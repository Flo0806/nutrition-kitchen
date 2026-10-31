import { C214200, N110000, R111000, R459000 } from "@thereforejs/foods";
import { calculateNutrition } from "@thereforejs/nutrition";
import { de, en } from "@thereforejs/nutrition/locales";
import { describe, expect, it } from "vitest";
import { labelTable, labelText } from "../../app/utils/labelText";

const rolls = (options: { referenceIntake?: boolean; voluntary?: ("fibre" | "starch")[] } = {}) =>
  calculateNutrition(
    {
      ingredients: [
        { amount: 1000, per100g: C214200.per100g },
        { amount: 420, per100g: N110000.per100g },
        { amount: 40, per100g: R459000.per100g },
        { amount: 20, per100g: R111000.per100g },
      ],
      pieceWeight: 60,
    },
    { locales: [de, en], ...options },
  );

// Like the library: a no-break space between a number and its unit, nowhere else.
const nb = (text: string) => text.replace(/(\d) (kJ|kcal|g|%)/g, "$1\u00a0$2");
const cells = (table: ReturnType<typeof labelTable>) =>
  table.rows.map((row) => [
    row.label,
    ...[row.per100g, row.perPiece].map((cell) => cell?.join(" / ")),
  ]);

describe("labelTable", () => {
  // The tables of the nutrition README, word for word.
  it("is the German README table", () => {
    const table = labelTable(rolls(), "de", 60);
    expect(table.columns).toEqual({
      per100g: nb("pro 100 g"),
      perPiece: nb("pro Stück (60 g)"),
      referenceIntake: undefined,
    });
    expect(cells(table)).toEqual(
      [
        ["Energie", "1016 kJ / 240 kcal", "609 kJ / 144 kcal"],
        ["Fett", "0,8 g", "<0,5 g"],
        ["davon: gesättigte Fettsäuren", "<0,1 g", "<0,1 g"],
        ["Kohlenhydrate", "48 g", "29 g"],
        ["davon: Zucker", "<0,5 g", "<0,5 g"],
        ["Eiweiß", "8,5 g", "5,1 g"],
        ["Salz", "1,3 g", "0,78 g"],
      ].map((row) => row.map(nb)),
    );
  });

  it("is the English README table", () => {
    expect(cells(labelTable(rolls(), "en", 60))).toEqual(
      [
        ["energy", "1016 kJ / 240 kcal", "609 kJ / 144 kcal"],
        ["fat", "0.8 g", "<0.5 g"],
        ["of which saturates", "<0.1 g", "<0.1 g"],
        ["carbohydrate", "48 g", "29 g"],
        ["of which sugars", "<0.5 g", "<0.5 g"],
        ["protein", "8.5 g", "5.1 g"],
        ["salt", "1.3 g", "0.78 g"],
      ].map((row) => row.map(nb)),
    );
  });

  it("puts voluntary nutrients in the order of Annex XV", () => {
    const keys = labelTable(rolls({ voluntary: ["fibre", "starch"] }), "de", 60).rows.map(
      (r) => r.key,
    );
    expect(keys).toEqual([
      "energy",
      "fat",
      "saturates",
      "carbohydrate",
      "sugars",
      "starch",
      "fibre",
      "protein",
      "salt",
    ]);
  });

  it("adds the percent column and the statement of Art. 32(5)", () => {
    const table = labelTable(rolls({ referenceIntake: true }), "de", 60);
    expect(table.columns.referenceIntake).toBe("% RM*");
    expect(table.rows[0]?.referenceIntake).toEqual([nb("12 %")]);
    expect(table.statement).toBe(
      "* Referenzmenge für einen durchschnittlichen Erwachsenen (8 400 kJ/2 000 kcal)",
    );
  });

  it("has no piece column without a piece weight", () => {
    const result = rolls();
    expect(
      labelTable({ ...result, perPiece: undefined }, "de", null).columns.perPiece,
    ).toBeUndefined();
  });
});

it("stacks kJ above kcal in the energy cells", () => {
  expect(labelTable(rolls(), "de", 60).rows[0]?.per100g).toEqual([nb("1016 kJ"), nb("240 kcal")]);
});

describe("labelText", () => {
  it("lines the columns up and leaves empty ones out", () => {
    const text = labelText(labelTable({ ...rolls(), perPiece: undefined }, "en", null));
    expect(text.split("\n").slice(0, 3)).toEqual([
      "Nutrition declaration",
      // The first column is as wide as its longest label, "of which saturates".
      `${"".padEnd(18)}  ${nb("per 100 g")}`,
      `${"energy".padEnd(18)}  ${nb("1016 kJ / 240 kcal")}`,
    ]);
  });
});
