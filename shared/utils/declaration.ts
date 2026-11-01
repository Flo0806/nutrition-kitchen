import {
  calculateNutrition,
  DiagnosticError,
  type Diagnostic,
  type NutritionResult,
  type Voluntary,
} from "@thereforejs/nutrition";
import { de, en } from "@thereforejs/nutrition/locales";
import type { FoodEntry } from "../types/food";
import { takeBakingLoss } from "./bakingLoss";
import type { Source } from "./source";
import { sourceValues } from "./material";

export type RecipeOptions = {
  pieceWeight: number | null;
  voluntary: Voluntary[];
  referenceIntake: boolean;
  /** Grams that evaporate in the oven, taken off the water. */
  bakingLoss: number | null;
};

type Row = Source & { id: number; amount: number | null };

/** A problem the library raised, with the row it points at when it points at one. */
export type Problem = { rowId: number | undefined; diagnostic: Diagnostic };

/** What the calculation went on without, per row. */
export type Gap = { rowId: number; nutrients: ReportedNutrient[] };
export type ReportedNutrient = NutritionResult["report"][number]["nutrient"];

export type Declared =
  | { state: "empty" }
  | { state: "loading" }
  | {
      state: "declared";
      result: NutritionResult;
      gaps: Gap[];
      /** Water rows as calculated, after the baking loss. */
      baked: { rowId: number; amount: number }[];
      withoutAmount: number[];
    }
  | { state: "refused"; problems: Problem[]; withoutAmount: number[] }
  | {
      state: "bakingLoss";
      problem: "noWater" | "exceedsWater";
      water: number;
      withoutAmount: number[];
    };

/**
 * The declaration of the recipe. Rows without an amount stay out and are named, so the label never
 * silently shows less than the list.
 */
export function declareRecipe(
  rows: Row[],
  foods: Record<string, FoodEntry>,
  options: RecipeOptions,
): Declared {
  const withoutAmount = rows.filter((row) => row.amount === null).map((row) => row.id);
  if (rows.every((row) => row.amount === null)) return { state: "empty" };
  const baking = takeBakingLoss(
    rows.filter((row) => row.amount !== null),
    options.bakingLoss,
  );
  if ("problem" in baking) return { state: "bakingLoss", ...baking, withoutAmount };
  const counted = baking.rows;
  const values = counted.map((row) => sourceValues(row, foods));
  if (values.some((value) => value === undefined)) return { state: "loading" };

  const ingredients = counted.map((row, index) => ({
    amount: row.amount ?? 0,
    per100g: values[index] ?? {},
  }));
  const rowAt = (path: string) => {
    const index = /^ingredients\[(\d+)\]/.exec(path)?.[1];
    return index === undefined ? undefined : counted[Number(index)]?.id;
  };

  try {
    const result = calculateNutrition(
      {
        ingredients,
        ...(options.pieceWeight === null ? {} : { pieceWeight: options.pieceWeight }),
      },
      { locales: [de, en], voluntary: options.voluntary, referenceIntake: options.referenceIntake },
    );
    return {
      state: "declared",
      result,
      gaps: gapsByRow(result, counted),
      baked: baking.baked,
      withoutAmount,
    };
  } catch (error) {
    if (!(error instanceof DiagnosticError)) throw error;
    const problems = error.diagnostics.map((diagnostic) => ({
      rowId: rowAt(diagnostic.path),
      diagnostic,
    }));
    return { state: "refused", problems, withoutAmount };
  }
}

// The report groups by nutrient ("2 ingredients without fibre"); the builder shows it at each row.
function gapsByRow(result: NutritionResult, counted: Row[]): Gap[] {
  const byRow = new Map<number, ReportedNutrient[]>();
  for (const entry of result.report) {
    for (const index of entry.ingredients) {
      const id = counted[index]?.id;
      if (id !== undefined) byRow.set(id, [...(byRow.get(id) ?? []), entry.nutrient]);
    }
  }
  return [...byRow].map(([rowId, nutrients]) => ({ rowId, nutrients }));
}

// Without these the energy is short (Annex XIV); a missing sugar or starch value does not change it.
const energyNutrients = new Set<ReportedNutrient>([
  "fat",
  "carbohydrate",
  "polyols",
  "protein",
  "fibre",
  "alcohol",
  "organicAcids",
  "salatrims",
  "erythritol",
]);

/** A row's gap split by why a value is missing: no value, below a limit, or only traces. */
export function explainGap(food: FoodEntry | undefined, nutrients: ReportedNutrient[]) {
  const marks: Partial<Record<string, string>> = food?.marks ?? {};
  return {
    missing: nutrients.filter((key) => !marks[key]),
    belowDetection: nutrients.filter((key) => marks[key] && marks[key] !== "TR"),
    traces: nutrients.filter((key) => marks[key] === "TR"),
    energyShort: nutrients.some((key) => energyNutrients.has(key)),
  };
}
