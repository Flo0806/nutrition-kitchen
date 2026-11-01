import { defineEventHandler } from "nuxt/server";
import { shareRecipe } from "../../../db/recipes";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const slug = shareRecipe(useDb(), user.id, recipeIdOf(event), newShareSlug());
  if (!slug) throw recipeNotFound();
  return { slug };
});
