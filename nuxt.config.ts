// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ["@nuxt/ui", "@nuxtjs/i18n", "nuxt-spyglass"],
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
  runtimeConfig: {
    // NUXT_DATABASE_PATH; in the Docker image .data is the volume.
    databasePath: ".data/nutrition-kitchen.sqlite",
  },
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  // The server runs on Node 22; Nitro's default es2019 target warns about BigInt literals in deps.
  nitro: { esbuild: { options: { target: "node22" } } },
  // E2E builds next to a running dev server; a shared .nuxt would break it.
  $env: {
    e2e: { buildDir: ".nuxt-e2e", nitro: { output: { dir: ".output-e2e" } } },
  },
});
