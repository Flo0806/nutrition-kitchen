import { defineEventHandler } from "nuxt/server";
import { getRecipe } from "../../db/recipes";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const recipe = getRecipe(useDb(), user.id, recipeIdOf(event));
  if (!recipe) throw recipeNotFound();
  return { ...recipe, updatedAt: recipe.updatedAt.toISOString() };
});
