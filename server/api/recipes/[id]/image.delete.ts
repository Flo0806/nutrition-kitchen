import { defineEventHandler, setResponseStatus } from "nuxt/server";
import { setRecipeImage } from "../../../db/recipes";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const set = setRecipeImage(useDb(), user.id, recipeIdOf(event), null);
  if (!set) throw recipeNotFound();
  if (set.previous) await usePictures().removeItem(set.previous);
  setResponseStatus(event, 204);
  return null;
});
