import { defineEventHandler, setResponseStatus } from "nuxt/server";
import { deleteUser } from "../../db/users";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  // The database first: a file left behind by a crash is unreachable, a row without its file not.
  const pictures = deleteUser(useDb(), user.id);
  await Promise.all(pictures.map((name) => usePictures().removeItem(name)));
  await clearUserSession(event);
  setResponseStatus(event, 204);
  return null;
});
