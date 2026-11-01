<script setup lang="ts">
import { de, en } from "@nuxt/ui/locale";

const { locale, localeProperties, t } = useI18n();

const origin = useRequestURL().origin;

useHead({
  htmlAttrs: { lang: () => localeProperties.value.language },
  titleTemplate: (title) => (title ? `${title} | ${t("app.name")}` : t("app.name")),
  link: [
    { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    { rel: "icon", href: "/favicon.ico", sizes: "48x48" },
    { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    { rel: "manifest", href: "/site.webmanifest" },
  ],
  meta: [{ name: "theme-color", content: "#2f7a4f" }],
});
// The preview when a link is shared; a shared recipe puts its own title over it.
useSeoMeta({
  ogSiteName: () => t("app.name"),
  ogTitle: () => t("app.name"),
  ogDescription: () => t("app.tagline"),
  ogImage: `${origin}/og.png`,
  ogImageWidth: 1200,
  ogImageHeight: 630,
  twitterCard: "summary_large_image",
});
</script>

<template>
  <UApp :locale="locale === 'en' ? en : de">
    <NuxtRouteAnnouncer />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
