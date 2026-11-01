import { C214200, N110000, R111000, R459000 } from "@thereforejs/foods";
import { describe, expect, it } from "vitest";
import { declareRecipe, explainGap, type RecipeOptions } from "../../shared/utils/declaration";
import type { FoodEntry } from "../../shared/types/food";

const entry = ({ code, name, per100g, marks }: FoodEntry): FoodEntry => ({
  code,
  name,
  per100g,
  marks,
});
const foods = Object.fromEntries(
  [C214200, N110000, R459000, R111000].map((f) => [f.code, entry(f)]),
);
// The library joins number and unit with a no-break space.
const nb = (text: string) => text.replaceAll(" ", "\u00a0");
const options: RecipeOptions = {
  pieceWeight: 60,
  voluntary: [],
  referenceIntake: false,
  bakingLoss: null,
};

// The bread rolls of the nutrition README: 600 g water less 180 g baking loss.
const rolls = [
  { id: 1, code: "C214200", amount: 1000 },
  { id: 2, code: "N110000", amount: 420 },
  { id: 3, code: "R459000", amount: 40 },
  { id: 4, code: "R111000", amount: 20 },
];

describe("declare", () => {
  it("gives the README declaration of the bread rolls", () => {
    const declared = declareRecipe(rolls, foods, options);
    if (declared.state !== "declared") throw new Error(declared.state);
    const { per100g, perPiece } = declared.result;
    expect(per100g.energy.kJ.text["de-DE"]).toBe(nb("1016 kJ"));
    expect(per100g.energy.kcal.text["de-DE"]).toBe(nb("240 kcal"));
    expect(per100g.salt.text["de-DE"]).toBe(nb("1,3 g"));
    expect(perPiece?.fat.text["en-GB"]).toBe(nb("<0.5 g"));
    expect(perPiece?.salt.text["en-GB"]).toBe(nb("0.78 g"));
  });

  it("names the gaps at the row they belong to", () => {
    const declared = declareRecipe(rolls, foods, options);
    if (declared.state !== "declared") throw new Error(declared.state);
    expect(declared.gaps).toEqual([
      { rowId: 3, nutrients: ["polyols", "alcohol", "organicAcids"] },
    ]);
  });

  it("leaves rows without an amount out and names them", () => {
    const declared = declareRecipe(
      [...rolls, { id: 5, code: "C214200", amount: null }],
      foods,
      options,
    );
    expect(declared).toMatchObject({ state: "declared", withoutAmount: [5] });
  });

  it("waits for values that are still loading", () => {
    expect(declareRecipe([{ id: 1, code: "Q630000", amount: 10 }], foods, options)).toEqual({
      state: "loading",
    });
  });

  it("is empty without a counted row", () => {
    expect(declareRecipe([], foods, options)).toEqual({ state: "empty" });
    expect(declareRecipe([{ id: 1, code: "C214200", amount: null }], foods, options)).toEqual({
      state: "empty",
    });
  });

  it("points a refusal at its row, counted without the rows left out", () => {
    // Flour whose sheet claims more sugars than carbohydrate.
    const flour = entry(C214200);
    const sweet: Record<string, FoodEntry> = {
      ...foods,
      X: { ...flour, code: "X", per100g: { ...flour.per100g, carbohydrate: "20", sugars: "35" } },
    };
    const declared = declareRecipe(
      [
        { id: 7, code: "C214200", amount: null },
        { id: 8, code: "C214200", amount: 100 },
        { id: 9, code: "X", amount: 50 },
      ],
      sweet,
      options,
    );
    expect(declared).toMatchObject({
      state: "refused",
      withoutAmount: [7],
      problems: [{ rowId: 9, diagnostic: { code: "value.partExceedsWhole" } }],
    });
  });

  it("refuses a recipe of 0 g without pointing at a row", () => {
    const declared = declareRecipe([{ id: 1, code: "C214200", amount: 0 }], foods, options);
    expect(declared).toMatchObject({
      state: "refused",
      problems: [{ rowId: undefined, diagnostic: { code: "weight.zero" } }],
    });
  });
});

describe("declare with a baking loss", () => {
  // The README rolls as typed into the app: 600 g water and 180 g baking loss.
  const typed = rolls.map((row) => (row.id === 2 ? { ...row, amount: 600 } : row));

  it("gives the same declaration as the rolls with 420 g water", () => {
    const baked = declareRecipe(typed, foods, { ...options, bakingLoss: 180 });
    const direct = declareRecipe(rolls, foods, options);
    if (baked.state !== "declared" || direct.state !== "declared") throw new Error("not declared");
    expect(baked.result).toEqual(direct.result);
    expect(baked.baked).toEqual([{ rowId: 2, amount: 420 }]);
  });

  it("refuses more loss than water before calculating", () => {
    expect(declareRecipe(typed, foods, { ...options, bakingLoss: 601 })).toMatchObject({
      state: "bakingLoss",
      problem: "exceedsWater",
      water: 600,
    });
  });
});

describe("explainGap", () => {
  it("tells a missing value from one below a limit and from traces", async () => {
    const { B121000, F110600, F504400 } = await import("@thereforejs/foods");
    expect(explainGap(entry(B121000), ["alcohol"])).toMatchObject({
      missing: [],
      belowDetection: ["alcohol"],
    });
    expect(explainGap(entry(F110600), ["fat"])).toMatchObject({ belowDetection: ["fat"] });
    expect(explainGap(entry(F504400), ["starch"])).toMatchObject({
      traces: ["starch"],
      missing: [],
    });
    expect(explainGap(entry(R459000), ["polyols"])).toMatchObject({ missing: ["polyols"] });
  });

  it("says the energy is short only for nutrients that carry energy", () => {
    expect(explainGap(entry(R459000), ["polyols"]).energyShort).toBe(true);
    expect(explainGap(entry(R459000), ["sugars", "starch", "saturates"]).energyShort).toBe(false);
  });
});
