import { calculateNutrition, DiagnosticError, type Diagnostic } from "@thereforejs/nutrition";
import type { FoodEntry } from "#shared/types/food";

/** What a supplier sheet gives, in the order of the label; energy is always calculated. */
export const materialNutrients = [
  "fat",
  "saturates",
  "carbohydrate",
  "sugars",
  "protein",
  "salt",
  "fibre",
] as const;
export type MaterialNutrient = (typeof materialNutrients)[number];

/** A raw material from a supplier sheet: grams per 100 g as exact decimal text, `null` unknown. */
export type CustomMaterial = { name: string; per100g: Record<MaterialNutrient, string | null> };

/** A row is a food of the database or a raw material of the user's own. */
export type Source = { code: string } | { custom: CustomMaterial };

type Language = "de" | "en";

export function sourceName(source: Source, foods: Record<string, FoodEntry>, language: Language) {
  return "custom" in source ? source.custom.name : foods[source.code]?.name[language];
}

/** The values to calculate with; `undefined` while a food is still loading. */
export function sourceValues(source: Source, foods: Record<string, FoodEntry>) {
  return "custom" in source ? source.custom.per100g : foods[source.code]?.per100g;
}

/**
 * The library's verdict on a raw material on its own, each refusal at the field it concerns. The app
 * has no rules of its own here: what the library accepts, the form accepts.
 */
export function checkMaterial(per100g: CustomMaterial["per100g"]) {
  try {
    calculateNutrition({ ingredients: [{ amount: 100, per100g }] });
    return [];
  } catch (error) {
    if (!(error instanceof DiagnosticError)) throw error;
    return error.diagnostics.map((diagnostic: Diagnostic) => {
      const key = /\.per100g\.(\w+)$/.exec(diagnostic.path)?.[1];
      const field = materialNutrients.find((nutrient) => nutrient === key);
      return { field, diagnostic };
    });
  }
}
