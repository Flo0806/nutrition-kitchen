import type { Source } from "./source";

type Row = Source & { id: number; amount: number | null };

/** Drinking, mineral and spring water: the BLS group N1. */
export const isWater = (source: Source) => "code" in source && source.code.startsWith("N1");

// Whole micrograms, so 600.5 g less 180.2 g is 420.3 g and not 420.29999999999995 g.
const micro = (grams: number) => Math.round(grams * 1e6);

export type Baked<R> =
  | { rows: R[]; baked: { rowId: number; amount: number }[] }
  | { problem: "noWater" | "exceedsWater"; water: number };

/**
 * The library knows only final grams: what evaporates in the oven is taken off the water, from the
 * first water row down, before it calculates.
 */
export function takeBakingLoss<R extends Row>(rows: R[], loss: number | null): Baked<R> {
  if (!loss) return { rows, baked: [] };
  const water = rows
    .filter((row) => isWater(row) && row.amount !== null)
    .reduce((sum, row) => sum + micro(row.amount ?? 0), 0);
  if (!rows.some((row) => isWater(row) && row.amount !== null))
    return { problem: "noWater", water: 0 };
  if (micro(loss) > water) return { problem: "exceedsWater", water: water / 1e6 };

  let left = micro(loss);
  const baked: { rowId: number; amount: number }[] = [];
  const result = rows.map((row) => {
    if (!isWater(row) || row.amount === null || left === 0) return row;
    const taken = Math.min(left, micro(row.amount));
    left -= taken;
    const amount = (micro(row.amount) - taken) / 1e6;
    baked.push({ rowId: row.id, amount });
    return { ...row, amount };
  });
  return { rows: result, baked };
}
