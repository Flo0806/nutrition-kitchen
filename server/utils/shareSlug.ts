import { randomBytes } from "node:crypto";
import { createError, getRouterParam, type RequestEvent } from "nuxt/server";
import { shareSlug } from "#shared/utils/share";

export function newShareSlug() {
  return randomBytes(9).toString("base64url");
}

/** A malformed slug is just as not found as an unknown one: nothing to learn from the answer. */
export function shareSlugOf(event: RequestEvent) {
  const slug = getRouterParam(event, "slug") ?? "";
  if (!shareSlug.test(slug)) throw sharedNotFound();
  return slug;
}

export function sharedNotFound() {
  return createError({ statusCode: 404, statusMessage: "Shared recipe not found" });
}
