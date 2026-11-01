import { defineEventHandler, setResponseStatus } from "nuxt/server";
import { setRecipeImage, unshareRecipe } from "../../../db/recipes";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = recipeIdOf(event);
  const unshared = unshareRecipe(useDb(), user.id, id);
  if (!unshared) throw recipeNotFound();
  // Whoever saw the shared page knows the picture's name: it gets a new one.
  if (unshared.image) {
    const picture = await usePictures().getItemRaw<Buffer>(unshared.image);
    if (picture) {
      const name = newPictureName();
      await usePictures().setItemRaw(name, picture);
      setRecipeImage(useDb(), user.id, id, name);
    }
    await usePictures().removeItem(unshared.image);
  }
  setResponseStatus(event, 204);
  return null;
});
