import { defineEventHandler } from "nuxt/server";

export default defineEventHandler(async (event) => {
  const { id, name, provider } = await requireUser(event);
  return { id, name, provider };
});
