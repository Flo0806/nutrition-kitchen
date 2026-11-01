import { defineEventHandler, readValidatedBody, setResponseStatus } from "nuxt/server";
import { recipeInput } from "#shared/utils/recipe";
import { createRecipe } from "../../db/recipes";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const input = await readValidatedBody(event, recipeInput.parse);
  const id = createRecipe(useDb(), user.id, input);
  if (id === "full") throw bookFull();
  setResponseStatus(event, 201);
  return { id };
});
