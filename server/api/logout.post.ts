import { defineEventHandler, setResponseStatus } from "nuxt/server";
import { endSessions } from "../db/users";

// Ends the session on every device, not just this cookie: a copied cookie stops working too. Only
// a valid session may do that, so an old cookie cannot sign its owner out elsewhere.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event).catch(() => undefined);
  if (user) endSessions(useDb(), user.id);
  await clearUserSession(event);
  setResponseStatus(event, 204);
  return null;
});
