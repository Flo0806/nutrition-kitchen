import { defineEventHandler } from "nuxt/server";
import type { SharedRecipe } from "#shared/utils/share";
import { getSharedRecipe } from "../../db/recipes";

export default defineEventHandler((event): SharedRecipe => {
  const recipe = getSharedRecipe(useDb(), shareSlugOf(event));
  if (!recipe) throw sharedNotFound();
  // Ending a share must end it at once, also for caches on the way.
  event.res.headers.set("cache-control", "no-store");
  const { title, instructions, rows, options, image } = recipe;
  return { title, instructions, rows, options, image };
});
