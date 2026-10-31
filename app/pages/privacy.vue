<script setup lang="ts">
const { locale, t } = useI18n();
useHead({ title: () => t("privacy.title") });
</script>

<template>
  <article class="max-w-prose">
    <LegalPrivacyEn v-if="locale === 'en'" />
    <LegalPrivacyDe v-else />
  </article>
</template>
