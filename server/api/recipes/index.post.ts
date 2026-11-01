import { defineEventHandler, readValidatedBody, setResponseStatus } from "nuxt/server";
import { recipeInput } from "#shared/utils/recipe";
import { createRecipe } from "../../db/recipes";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const input = await readValidatedBody(event, recipeInput.parse);
  setResponseStatus(event, 201);
  return { id: createRecipe(useDb(), user.id, input) };
});
