import { z } from "zod";
import { foodCode } from "#shared/utils/foodCode";
import type { RecipeOptions } from "~/utils/declaration";
import { materialNutrients, type Source } from "~/utils/material";

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
const custom = z.object({
  name: z.string().trim().min(1).max(120),
  per100g: z.object(
    Object.fromEntries(materialNutrients.map((key) => [key, decimalText.nullable()])) as Record<
      (typeof materialNutrients)[number],
      z.ZodNullable<typeof decimalText>
    >,
  ),
});
const amount = grams.nullable();

const draftSchema = z.object({
  version: z.literal(1),
  rows: z
    .array(z.union([z.object({ code: foodCode, amount }), z.object({ custom, amount })]))
    .max(200),
  options: z
    .object({
      pieceWeight: grams.nullable(),
      voluntary: z.array(
        z.enum(["monounsaturates", "polyunsaturates", "polyols", "starch", "fibre"]),
      ),
      referenceIntake: z.boolean(),
      // Drafts from before the baking loss have none.
      bakingLoss: grams.nullable().default(null),
    })
    .default(defaultRecipeOptions),
});

export type Draft = z.infer<typeof draftSchema>;
export type DraftRow = Draft["rows"][number];

type Row = Source & { amount: number | null };

export function serializeDraft({ rows, options }: { rows: Row[]; options: RecipeOptions }): string {
  return JSON.stringify({
    version: 1,
    rows: rows.map((row) =>
      "custom" in row
        ? { custom: row.custom, amount: row.amount }
        : { code: row.code, amount: row.amount },
    ),
    options: {
      pieceWeight: options.pieceWeight,
      voluntary: options.voluntary,
      referenceIntake: options.referenceIntake,
      bakingLoss: options.bakingLoss,
    },
  });
}

/** `null` when nothing is stored, `"broken"` when something is stored that cannot be read. */
export function parseDraft(text: string | null): Omit<Draft, "version"> | "broken" | null {
  if (text === null) return null;
  try {
    const result = draftSchema.safeParse(JSON.parse(text));
    return result.success ? { rows: result.data.rows, options: result.data.options } : "broken";
  } catch {
    return "broken";
  }
}
