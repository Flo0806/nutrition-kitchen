import { z } from "zod";
import { foodCode } from "#shared/utils/foodCode";
import type { LabelOptions } from "~/utils/declaration";

/** Grams; one tonne is far beyond any kitchen and keeps typos out. */
export const maxAmount = 1_000_000;

export const defaultLabelOptions: LabelOptions = {
  pieceWeight: null,
  voluntary: [],
  referenceIntake: false,
};

const grams = z.number().nonnegative().max(maxAmount);

const draftSchema = z.object({
  version: z.literal(1),
  rows: z.array(z.object({ code: foodCode, amount: grams.nullable() })).max(200),
  options: z
    .object({
      pieceWeight: grams.nullable(),
      voluntary: z.array(
        z.enum(["monounsaturates", "polyunsaturates", "polyols", "starch", "fibre"]),
      ),
      referenceIntake: z.boolean(),
    })
    .default(defaultLabelOptions),
});

export type Draft = z.infer<typeof draftSchema>;
export type DraftRow = Draft["rows"][number];

export function serializeDraft({ rows, options }: Omit<Draft, "version">): string {
  return JSON.stringify({
    version: 1,
    rows: rows.map(({ code, amount }) => ({ code, amount })),
    options: {
      pieceWeight: options.pieceWeight,
      voluntary: options.voluntary,
      referenceIntake: options.referenceIntake,
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
