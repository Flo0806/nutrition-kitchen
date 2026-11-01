<script setup lang="ts">
import { LazyBookSaveModal } from "#components";

const { t } = useI18n();
const { loggedIn } = useUserSession();
const { rows, saved, startNew } = useRecipe();
const toast = useToast();
const confirm = useConfirm();
const saveModal = useOverlay().create(LazyBookSaveModal);

async function saveRecipe() {
  if (await saveModal.open({ saved: saved.value }).result) {
    toast.add({ title: t("save.saved"), color: "success" });
  }
}

async function newRecipe() {
  if (rows.value.length > 0) {
    const ok = await confirm({
      title: t("save.newConfirm"),
      description: saved.value ? t("save.newKeeps", { title: saved.value.title }) : undefined,
      confirm: t("save.new"),
    });
    if (!ok) return;
  }
  startNew();
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-3" data-testid="recipe-bar">
    <p v-if="saved" class="mr-auto text-lg">
      {{ t("save.editing") }} <strong>{{ saved.title }}</strong>
    </p>
    <UButton
      v-if="loggedIn"
      icon="i-lucide-save"
      :label="t('save.button')"
      :disabled="rows.length === 0"
      @click="saveRecipe"
    />
    <UButton
      v-else
      to="/login"
      icon="i-lucide-save"
      variant="outline"
      :label="t('save.needsLogin')"
    />
    <UButton
      v-if="rows.length > 0 || saved"
      icon="i-lucide-file-plus"
      color="neutral"
      variant="ghost"
      :label="t('save.new')"
      @click="newRecipe"
    />
  </div>
</template>
