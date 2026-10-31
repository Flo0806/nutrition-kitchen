<script setup lang="ts">
const { locale, t } = useI18n();
useHead({ title: () => t("imprint.title") });
</script>

<template>
  <article class="max-w-prose">
    <LegalImprintEn v-if="locale === 'en'" />
    <LegalImprintDe v-else />
  </article>
</template>
