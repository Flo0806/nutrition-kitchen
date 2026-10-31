<script setup lang="ts">
import { de, en } from "@nuxt/ui/locale";

const { locale, localeProperties, t } = useI18n();

useHead({
  htmlAttrs: { lang: () => localeProperties.value.language },
  titleTemplate: (title) => (title ? `${title} | ${t("app.name")}` : t("app.name")),
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
