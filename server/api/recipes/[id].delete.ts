import { defineEventHandler, setResponseStatus } from "nuxt/server";
import { deleteRecipe } from "../../db/recipes";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const deleted = deleteRecipe(useDb(), user.id, recipeIdOf(event));
  if (!deleted) throw recipeNotFound();
  if (deleted.image) await usePictures().removeItem(deleted.image);
  setResponseStatus(event, 204);
  return null;
});
