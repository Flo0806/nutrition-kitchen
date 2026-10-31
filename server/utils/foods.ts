import * as foods from "@thereforejs/foods";
import type { Food } from "@thereforejs/foods";
import type { FoodEntry } from "#shared/types/food";

// All 7,100 foods in one table; this is why foods stay on the server.
const byCode: Record<string, Food | undefined> = foods;

export function findFood(code: string): FoodEntry | undefined {
  const food = Object.hasOwn(byCode, code) ? byCode[code] : undefined;
  if (!food) return undefined;
  return { code: food.code, name: food.name, per100g: food.per100g, marks: food.marks };
}
