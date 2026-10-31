import { z } from "zod";
import { foodCode } from "#shared/utils/foodCode";

/** Grams; one tonne is far beyond any kitchen and keeps typos out. */
export const maxAmount = 1_000_000;

const draftSchema = z.object({
  version: z.literal(1),
  rows: z
    .array(
      z.object({
        code: foodCode,
        amount: z.number().nonnegative().max(maxAmount).nullable(),
      }),
    )
    .max(200),
});

export type DraftRow = z.infer<typeof draftSchema>["rows"][number];

export function serializeDraft(rows: DraftRow[]): string {
  return JSON.stringify({ version: 1, rows: rows.map(({ code, amount }) => ({ code, amount })) });
}

/** `null` when nothing is stored, `"broken"` when something is stored that cannot be read. */
export function parseDraft(text: string | null): DraftRow[] | "broken" | null {
  if (text === null) return null;
  try {
    const result = draftSchema.safeParse(JSON.parse(text));
    return result.success ? result.data.rows : "broken";
  } catch {
    return "broken";
  }
}
