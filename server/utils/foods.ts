import * as foods from "@thereforejs/foods";
import type { Food } from "@thereforejs/foods";
import type { FoodEntry } from "#shared/types/food";
import { z } from "zod";

// All 7,100 foods in one table; this is why foods stay on the server.
const byCode: Record<string, Food | undefined> = foods;

/** A BLS code is a letter and six characters (C214200, Q6A4000); own codes look like H_000001. */
export const foodCode = z.string().regex(/^[A-Z][A-Z0-9_]{6,7}$/);

export function findFood(code: string): FoodEntry | undefined {
  const food = Object.hasOwn(byCode, code) ? byCode[code] : undefined;
  if (!food) return undefined;
  return { code: food.code, name: food.name, per100g: food.per100g, marks: food.marks };
}
