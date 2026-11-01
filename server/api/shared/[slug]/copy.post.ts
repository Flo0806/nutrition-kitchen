import { defineEventHandler, setResponseStatus } from "nuxt/server";
import { createRecipe, getSharedRecipe, setRecipeImage } from "../../../db/recipes";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const recipe = getSharedRecipe(useDb(), shareSlugOf(event));
  if (!recipe) throw sharedNotFound();
  // Checked before anything is written: no half copy.
  if (recipe.image) checkPictureRate(user.id);

  const id = createRecipe(useDb(), user.id, recipe);
  if (id === "full") throw bookFull();
  // A file of its own, so the copy keeps its photo when the original goes.
  const picture = recipe.image && (await usePictures().getItemRaw<Buffer>(recipe.image));
  if (picture) {
    const name = newPictureName();
    await usePictures().setItemRaw(name, picture);
    setRecipeImage(useDb(), user.id, id, name);
  }
  setResponseStatus(event, 201);
  return { id };
});
