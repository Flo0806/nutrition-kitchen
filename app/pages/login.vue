<script setup lang="ts">
const { t } = useI18n();
const route = useRoute();
const { loggedIn, user } = useUserSession();
useHead({ title: () => t("auth.title") });

const handle = ref("");
const handleError = ref("");
const failed = computed(() => {
  const provider = route.query.failed;
  return provider === "google" || provider === "bluesky" ? t(`auth.failed.${provider}`) : "";
});

async function withBluesky() {
  const name = handle.value.trim().replace(/^@/, "");
  handleError.value = name ? "" : t("auth.handleRequired");
  if (!name) return;
  await navigateTo({ path: "/auth/bluesky", query: { handle: name } }, { external: true });
}
</script>

<template>
  <article class="max-w-md">
    <h1 class="text-3xl font-bold">{{ t("auth.title") }}</h1>
    <template v-if="loggedIn && user">
      <p class="mt-4 text-lg">{{ t("auth.signedInAs", { name: user.name }) }}</p>
      <UButton class="mt-6" to="/" icon="i-lucide-arrow-left" :label="t('auth.back')" />
    </template>
    <template v-else>
      <p class="mt-4 text-lg">{{ t("auth.intro") }}</p>
      <UAlert v-if="failed" class="mt-6" color="error" variant="subtle" :title="failed" />
      <UButton
        class="mt-8 w-full justify-center"
        size="xl"
        to="/auth/google"
        external
        icon="i-lucide-log-in"
        :label="t('auth.google')"
      />
      <form class="mt-8 flex flex-col gap-3" novalidate @submit.prevent="withBluesky">
        <UFormField :label="t('auth.handle')" :error="handleError || undefined">
          <UInput
            v-model="handle"
            class="w-full"
            size="xl"
            autocomplete="username"
            autocapitalize="none"
            :placeholder="t('auth.handlePlaceholder')"
          />
        </UFormField>
        <UButton
          type="submit"
          class="w-full justify-center"
          size="xl"
          color="neutral"
          variant="outline"
          :label="t('auth.bluesky')"
        />
      </form>
    </template>
  </article>
</template>
