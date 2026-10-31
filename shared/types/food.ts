import type { Food } from "@thereforejs/foods";

/** One food as the foods api returns it: what the label needs, without the source bookkeeping. */
export type FoodEntry = Pick<Food, "code" | "name" | "per100g" | "marks">;
