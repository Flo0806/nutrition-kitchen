import type { FoodEntry } from "#shared/types/food";

// Requests in flight, so two rows of the same food fetch it once. Client only.
const pending = new Map<string, Promise<void>>();

/** Values and names of the foods in the recipe, fetched one by one from the foods api. */
export function useFoods() {
  const foods = useState<Record<string, FoodEntry>>("foods", () => ({}));
  const failed = useState<Record<string, boolean>>("foods-failed", () => ({}));

  function load(code: string) {
    if (import.meta.server || foods.value[code] || pending.has(code)) return;
    failed.value[code] = false;
    const request = $fetch<FoodEntry>(`/api/foods/${code}`)
      .then((food) => {
        foods.value[code] = food;
      })
      .catch(() => {
        failed.value[code] = true;
      })
      .finally(() => pending.delete(code));
    pending.set(code, request);
  }

  return { foods, failed, load };
}
