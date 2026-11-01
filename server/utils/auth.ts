import { createError, deleteCookie, getCookie, type RequestEvent } from "nuxt/server";
import { loginReturnCookie, loginReturnPath } from "#shared/utils/share";
import { eq } from "drizzle-orm";
import { upsertUser, type Account } from "../db/users";
import { users } from "../db/schema";

/** Signs in the user of an account, creating them on their first login. */
export async function signIn(event: RequestEvent, account: Account) {
  const { sessionVersion, ...user } = upsertUser(useDb(), account);
  await setUserSession(event, { user, secure: { sessionVersion }, loggedInAt: Date.now() });
  return user;
}

/**
 * The signed-in user, or 401. Checked against the database, so the cookie of a deleted account or
 * of an ended session opens nothing.
 */
export async function requireUser(event: RequestEvent) {
  const { user, secure } = await requireUserSession(event);
  const found = useDb().select().from(users).where(eq(users.id, user.id)).get();
  if (!found || found.sessionVersion !== secure?.sessionVersion) {
    await clearUserSession(event);
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  return found;
}

/** Where to go after a login: back to the shared recipe it started on, or home. */
export function loginReturn(event: RequestEvent) {
  const path = loginReturnPath(getCookie(event, loginReturnCookie));
  deleteCookie(event, loginReturnCookie);
  return path ?? "/";
}
