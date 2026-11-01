import { z } from "zod";
import type { RecipeOptions } from "./declaration";
import { foodCode } from "./foodCode";
import { materialNutrients, type MaterialNutrient, type Source } from "./source";

// The rules of a recipe as input, shared by the browser draft and the server: one place to change.

/** Grams; one tonne is far beyond any kitchen and keeps typos out. */
export const maxAmount = 1_000_000;

export const defaultRecipeOptions: RecipeOptions = {
  pieceWeight: null,
  voluntary: [],
  referenceIntake: false,
  bakingLoss: null,
};

const grams = z.number().nonnegative().max(maxAmount);
const decimalText = z.string().regex(/^\d+(\.\d+)?$/);
const amount = grams.nullable();

const custom = z.object({
  name: z.string().trim().min(1).max(120),
  per100g: z.object(
    Object.fromEntries(materialNutrients.map((key) => [key, decimalText.nullable()])) as Record<
      MaterialNutrient,
      z.ZodNullable<typeof decimalText>
    >,
  ),
});

export const recipeRows = z
  .array(z.union([z.object({ code: foodCode, amount }), z.object({ custom, amount })]))
  .max(200);

export const recipeOptions = z.object({
  pieceWeight: grams.nullable(),
  voluntary: z.array(z.enum(["monounsaturates", "polyunsaturates", "polyols", "starch", "fibre"])),
  referenceIntake: z.boolean(),
  // Drafts from before the baking loss have none.
  bakingLoss: grams.nullable().default(null),
});

export const recipeTitle = z.string().trim().min(1).max(120);
export const recipeInstructions = z.string().trim().max(5000);

/** What saving a recipe sends: never a result, the declaration is calculated on every view. */
export const recipeInput = z.object({
  title: recipeTitle,
  instructions: recipeInstructions,
  rows: recipeRows.min(1),
  options: recipeOptions,
});

export type RecipeInput = z.infer<typeof recipeInput>;

/** A row as stored and sent: its source and amount, nothing the builder adds (ids, state). */
export function inputRow(row: Source & { amount: number | null }) {
  return "custom" in row
    ? { custom: row.custom, amount: row.amount }
    : { code: row.code, amount: row.amount };
}
