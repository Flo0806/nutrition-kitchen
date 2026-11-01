import { defineEventHandler, readValidatedBody } from "nuxt/server";
import { recipeInput } from "#shared/utils/recipe";
import { updateRecipe } from "../../db/recipes";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = recipeIdOf(event);
  const input = await readValidatedBody(event, recipeInput.parse);
  if (!updateRecipe(useDb(), user.id, id, input)) throw recipeNotFound();
  return { id };
});
