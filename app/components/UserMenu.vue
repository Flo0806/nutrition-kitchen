<script setup lang="ts">
const { t } = useI18n();
const { loggedIn, user, clear } = useUserSession();

const items = computed(() => [
  [{ label: user.value?.name ?? "", type: "label" as const }],
  [{ label: t("auth.logout"), icon: "i-lucide-log-out", onSelect: () => clear() }],
]);
</script>

<template>
  <UDropdownMenu v-if="loggedIn && user" :items="items">
    <!-- Initials, not the provider's picture: loading it would contact Google or Bluesky. -->
    <UButton color="neutral" variant="ghost" :aria-label="t('auth.menu', { name: user.name })">
      <UAvatar :alt="user.name" size="md" />
    </UButton>
  </UDropdownMenu>
  <UButton v-else to="/login" color="neutral" variant="outline" :label="t('auth.login')" />
</template>
