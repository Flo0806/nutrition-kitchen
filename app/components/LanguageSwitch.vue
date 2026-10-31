<script setup lang="ts">
const { locale, locales, setLocale, t } = useI18n();
</script>

<template>
  <div role="group" :aria-label="t('language.label')" class="flex gap-1">
    <UButton
      v-for="option in locales"
      :key="option.code"
      :label="option.code.toUpperCase()"
      :aria-label="option.name"
      :aria-pressed="option.code === locale"
      :variant="option.code === locale ? 'solid' : 'ghost'"
      color="neutral"
      size="lg"
      @click="setLocale(option.code)"
    />
  </div>
</template>
