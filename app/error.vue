<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();
const { t } = useI18n();
const notFound = computed(() => props.error.statusCode === 404);
useHead({ title: () => (notFound.value ? t("errorPage.notFound") : t("errorPage.failed")) });
</script>

<template>
  <UApp>
    <NuxtLayout>
      <section class="max-w-xl">
        <h1 class="text-3xl font-bold">
          {{ notFound ? t("errorPage.notFound") : t("errorPage.failed") }}
        </h1>
        <p class="mt-4 text-lg">
          {{ notFound ? t("errorPage.notFoundHint") : t("errorPage.failedHint") }}
        </p>
        <UButton
          class="mt-8"
          icon="i-lucide-arrow-left"
          :label="t('errorPage.home')"
          @click="clearError({ redirect: '/' })"
        />
      </section>
    </NuxtLayout>
  </UApp>
</template>
