import type { FoodEntry } from "#shared/types/food";
import { declareRecipe } from "#shared/utils/declaration";
import type { StoredRecipe } from "../db/recipes";

/**
 * Energy per 100 g of a saved recipe, calculated now from its inputs, so a patch of foods reaches
 * it. `null` when the recipe cannot be declared (no amounts, a refusal).
 */
export function recipeEnergy({ rows, options }: Pick<StoredRecipe, "rows" | "options">) {
  const foods: Record<string, FoodEntry> = {};
  for (const row of rows) {
    if (!("code" in row)) continue;
    const food = findFood(row.code);
    if (food) foods[row.code] = food;
  }
  const declared = declareRecipe(
    rows.map((row, id) => ({ ...row, id })),
    foods,
    options,
  );
  if (declared.state !== "declared") return null;
  const { kJ, kcal } = declared.result.per100g.energy;
  return {
    "de-DE": `${kJ.text["de-DE"]} / ${kcal.text["de-DE"]}`,
    "en-GB": `${kJ.text["en-GB"]} / ${kcal.text["en-GB"]}`,
  };
}
