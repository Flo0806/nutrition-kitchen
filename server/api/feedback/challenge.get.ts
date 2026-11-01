import { defineEventHandler } from "nuxt/server";

export default defineEventHandler((event) => {
  event.res.headers.set("cache-control", "no-store");
  return createAltchaChallenge();
});
