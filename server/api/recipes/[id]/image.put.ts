import { createError, defineEventHandler, getRequestHeader } from "nuxt/server";
import { setRecipeImage } from "../../../db/recipes";
import { maxPictureBytes, toPicture } from "../../../pictures/convert";

// Multipart adds a little around the file itself.
const maxBodyBytes = maxPictureBytes + 64 * 1024;

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = recipeIdOf(event);
  checkPictureRate(user.id);
  // Refuse a large body before reading it.
  if (Number(getRequestHeader(event, "content-length") ?? 0) > maxBodyBytes) {
    throw createError({ statusCode: 413, statusMessage: "Picture too large" });
  }
  const file = (await event.req.formData()).get("picture");
  if (!(file instanceof Blob)) throw createError({ statusCode: 400, statusMessage: "No picture" });
  if (file.size > maxPictureBytes)
    throw createError({ statusCode: 413, statusMessage: "Picture too large" });

  const picture = await toPicture(new Uint8Array(await file.arrayBuffer()));
  if (picture === "unsupported") {
    throw createError({ statusCode: 415, statusMessage: "Only JPEG, PNG and WebP pictures" });
  }

  const name = newPictureName();
  await usePictures().setItemRaw(name, picture);
  const set = setRecipeImage(useDb(), user.id, id, name);
  if (!set) {
    await usePictures().removeItem(name);
    throw recipeNotFound();
  }
  if (set.previous) await usePictures().removeItem(set.previous);
  return { image: name };
});
