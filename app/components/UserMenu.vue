<script setup lang="ts">
const { t } = useI18n();
const { loggedIn, user } = useUserSession();
const { logout, deleteAccount } = useAccount();
const confirm = useConfirm();
const describeError = useRequestError();
const toast = useToast();

async function signOut() {
  await logout();
  await navigateTo("/");
}

async function deleteEverything() {
  const ok = await confirm({
    title: t("account.deleteConfirm"),
    description: t("account.deleteFinal"),
    confirm: t("account.delete"),
    danger: true,
  });
  if (!ok) return;
  try {
    await deleteAccount();
    toast.add({ title: t("account.deleted"), color: "success" });
    await navigateTo("/");
  } catch (error) {
    toast.add({ title: describeError(error), color: "error" });
  }
}

const items = computed(() => [
  [{ label: user.value?.name ?? "", type: "label" as const }],
  [{ label: t("book.title"), icon: "i-lucide-book-open", to: "/book" }],
  [
    { label: t("auth.logout"), icon: "i-lucide-log-out", onSelect: signOut },
    {
      label: t("account.delete"),
      icon: "i-lucide-user-x",
      color: "error" as const,
      onSelect: deleteEverything,
    },
  ],
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
