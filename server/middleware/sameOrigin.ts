import { createError, defineEventHandler, getRequestHeader } from "nuxt/server";

const safe = new Set(["GET", "HEAD", "OPTIONS"]);

// Changes come from this site only. SameSite=lax keeps the session cookie from other sites, but a
// sibling subdomain counts as the same site. Browsers say where a request starts; tools without
// the header get through, they hold no victim's cookie.
export default defineEventHandler((event) => {
  if (safe.has(event.req.method)) return;
  const site = getRequestHeader(event, "sec-fetch-site");
  if (site === "cross-site" || site === "same-site") {
    throw createError({ statusCode: 403, statusMessage: "Cross-site request refused" });
  }
});
