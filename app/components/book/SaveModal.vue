<script setup lang="ts">
import { recipeInstructions, recipeTitle } from "#shared/utils/recipe";
import type { SavedRecipe } from "~/utils/draft";

const props = defineProps<{ saved: SavedRecipe | null }>();
const emit = defineEmits<{ close: [saved: boolean] }>();

const { t } = useI18n();
const { save, setPicture } = useRecipeBook();
const describeError = useRequestError();

const title = ref(props.saved?.title ?? "");
const instructions = ref(props.saved?.instructions ?? "");
const photo = ref<File | null>(null);
const removePhoto = ref(false);
const titleError = ref("");
const failure = ref("");
const busy = ref(false);

async function submit() {
  titleError.value = recipeTitle.safeParse(title.value).success ? "" : t("save.titleRequired");
  if (titleError.value) return;
  busy.value = true;
  failure.value = "";
  try {
    const id = await save({
      title: title.value.trim(),
      instructions: recipeInstructions.parse(instructions.value),
    });
    if (photo.value) await setPicture(id, photo.value);
    else if (removePhoto.value) await setPicture(id, null);
    emit("close", true);
  } catch (error) {
    failure.value = describeError(error);
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <UModal
    :title="saved ? t('save.updateTitle') : t('save.title')"
    @update:open="(open) => !open && emit('close', false)"
  >
    <template #body>
      <form id="save-form" class="flex flex-col gap-4" novalidate @submit.prevent="submit">
        <UFormField :label="t('save.name')" :error="titleError || undefined" required>
          <UInput v-model="title" class="w-full" size="lg" maxlength="120" autofocus />
        </UFormField>
        <UFormField :label="t('save.instructions')" :hint="t('save.optional')">
          <UTextarea v-model="instructions" class="w-full" :rows="5" maxlength="5000" autoresize />
        </UFormField>
        <UFormField :label="t('save.photo')" :description="t('save.photoHint')">
          <img
            v-if="saved?.image && !photo && !removePhoto"
            :src="`/pictures/${saved.image}`"
            :alt="t('save.currentPhoto')"
            class="mb-2 h-32 rounded-md object-cover"
          />
          <UFileUpload
            v-model="photo"
            accept="image/jpeg,image/png,image/webp"
            :label="t('save.choosePhoto')"
            class="w-full"
          />
          <UCheckbox
            v-if="saved?.image && !photo"
            v-model="removePhoto"
            class="mt-2"
            :label="t('save.removePhoto')"
          />
        </UFormField>
        <p v-if="failure" class="text-error" role="alert">{{ failure }}</p>
      </form>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('confirm.cancel')"
          @click="emit('close', false)"
        />
        <UButton type="submit" form="save-form" :loading="busy" :label="t('save.button')" />
      </div>
    </template>
  </UModal>
</template>
