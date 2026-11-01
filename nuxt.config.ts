// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/ui", "@nuxtjs/i18n", "nuxt-auth-utils", "nuxt-spyglass"],
  css: ["~/assets/css/main.css"],
  // Light only: the label is printed matter and must look the same on every screen.
  ui: { colorMode: false },
  i18n: {
    // Same paths in both languages; the choice lives in a cookie, so nobody gets redirected.
    strategy: "no_prefix",
    defaultLocale: "de",
    locales: [
      { code: "de", language: "de-DE", name: "Deutsch", file: "de.json" },
      { code: "en", language: "en-GB", name: "English", file: "en.json" },
    ],
    detectBrowserLanguage: { useCookie: true, cookieKey: "locale", fallbackLocale: "de" },
  },
  auth: { atproto: true },
  runtimeConfig: {
    // NUXT_DATABASE_PATH; in the Docker image .data is the volume.
    databasePath: ".data/nutrition-kitchen.sqlite",
    // Declared so NUXT_SESSION_COOKIE_SECURE can turn it off for the http-only e2e server.
    session: { cookie: { secure: true } },
    oauth: {
      // NUXT_OAUTH_GOOGLE_CLIENT_ID, _CLIENT_SECRET, _REDIRECT_URL (see .env.example)
      google: { clientId: "", clientSecret: "", redirectURL: "" },
      bluesky: {
        clientName: "Nutrition Kitchen",
        clientUri: "https://nutrition.fh-softdev.de",
        policyUri: "https://nutrition.fh-softdev.de/privacy",
        scope: ["atproto"],
        // Without it the metadata names its own path as the way back, and Bluesky refuses the login.
        redirectUris: ["/auth/bluesky"],
      },
    },
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  // The server runs on Node 22; Nitro's default es2019 target warns about BigInt literals in deps.
  nitro: {
    esbuild: { options: { target: "node22" } },
    // Photos of recipes, next to the database in .data (the volume in the Docker image).
    storage: { pictures: { driver: "fs", base: ".data/pictures" } },
    devStorage: { pictures: { driver: "fs", base: ".data/pictures" } },
  },
  // E2E builds next to a running dev server; a shared .nuxt would break it.
  $env: {
    e2e: {
      buildDir: ".nuxt-e2e",
      nitro: {
        output: { dir: ".output-e2e" },
        storage: { pictures: { driver: "fs", base: ".data/e2e/pictures" } },
        // Sign-in without a provider, for the tests only; no other build has this route.
        handlers: [
          {
            route: "/api/test/login",
            method: "post",
            handler: "~~/server/test/login.post.ts",
          },
        ],
      },
    },
  },
});
