import { z } from "zod";
import type { RecipeOptions } from "#shared/utils/declaration";
import {
  defaultRecipeOptions,
  inputRow,
  recipeInstructions,
  recipeOptions,
  recipeRows,
  recipeTitle,
} from "#shared/utils/recipe";
import type { Source } from "#shared/utils/source";

/** The saved recipe the draft edits; saving again updates it instead of adding a new one. */
export type SavedRecipe = { id: number; title: string; instructions: string; image: string | null };

const draftSchema = z.object({
  version: z.literal(1),
  rows: recipeRows,
  options: recipeOptions.default(defaultRecipeOptions),
  saved: z
    .object({
      id: z.number().int().positive(),
      title: recipeTitle,
      instructions: recipeInstructions,
      image: z.string().nullable(),
    })
    .nullable()
    .default(null),
});

export type Draft = Omit<z.infer<typeof draftSchema>, "version">;

type Row = Source & { amount: number | null };

export function serializeDraft({
  rows,
  options,
  saved,
}: {
  rows: Row[];
  options: RecipeOptions;
  saved: SavedRecipe | null;
}): string {
  return JSON.stringify({
    version: 1,
    rows: rows.map(inputRow),
    options: {
      pieceWeight: options.pieceWeight,
      voluntary: options.voluntary,
      referenceIntake: options.referenceIntake,
      bakingLoss: options.bakingLoss,
    },
    saved: saved && {
      id: saved.id,
      title: saved.title,
      instructions: saved.instructions,
      image: saved.image,
    },
  });
}

/** `null` when nothing is stored, `"broken"` when something is stored that cannot be read. */
export function parseDraft(text: string | null): Draft | "broken" | null {
  if (text === null) return null;
  try {
    const result = draftSchema.safeParse(JSON.parse(text));
    if (!result.success) return "broken";
    const { rows, options, saved } = result.data;
    return { rows, options, saved };
  } catch {
    return "broken";
  }
}
