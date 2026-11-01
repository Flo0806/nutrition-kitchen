import { createError, defineEventHandler, getRouterParam } from "nuxt/server";

export default defineEventHandler(async (event) => {
  const name = getRouterParam(event, "name") ?? "";
  if (!pictureName.test(name)) throw createError({ statusCode: 404, statusMessage: "Not found" });
  const picture = await usePictures().getItemRaw<Buffer>(name);
  if (!picture) throw createError({ statusCode: 404, statusMessage: "Not found" });
  event.res.headers.set("content-type", "image/webp");
  // A name is never reused: a new photo gets a new one.
  event.res.headers.set("cache-control", "public, max-age=31536000, immutable");
  return picture;
});
