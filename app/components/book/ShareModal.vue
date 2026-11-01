<script setup lang="ts">
import { sharedPath } from "#shared/utils/share";

const props = defineProps<{ id: number; title: string; shareSlug: string | null }>();
const emit = defineEmits<{ close: [] }>();

const { t } = useI18n();
const toast = useToast();
const describeError = useRequestError();
const origin = useRequestURL().origin;

const slug = ref(props.shareSlug);
const busy = ref(false);
const failure = ref("");
const link = computed(() => (slug.value ? `${origin}${sharedPath(slug.value)}` : ""));

async function request(run: () => Promise<void>) {
  busy.value = true;
  failure.value = "";
  try {
    await run();
  } catch (error) {
    failure.value = describeError(error);
  } finally {
    busy.value = false;
  }
}

const share = () =>
  request(async () => {
    const shared = await $fetch<{ slug: string }>(`/api/recipes/${props.id}/share`, {
      method: "PUT",
    });
    slug.value = shared.slug;
  });

const unshare = () =>
  request(async () => {
    await $fetch(`/api/recipes/${props.id}/share`, { method: "DELETE" });
    slug.value = null;
    toast.add({ title: t("share.stopped"), color: "success" });
  });

async function copy() {
  await navigator.clipboard.writeText(link.value);
  toast.add({ title: t("share.copied"), color: "success" });
}
</script>

<template>
  <UModal
    :title="t('share.title', { title })"
    :description="slug ? t('share.sharedHint') : t('share.hint')"
    @update:open="(open) => !open && emit('close')"
  >
    <template #body>
      <div v-if="slug" class="flex flex-col gap-3">
        <UFormField :label="t('share.link')">
          <UInput
            :model-value="link"
            class="w-full"
            size="lg"
            readonly
            @focus="$event.target.select()"
          />
        </UFormField>
        <div class="flex flex-wrap gap-2">
          <UButton icon="i-lucide-copy" :label="t('share.copy')" @click="copy" />
          <UButton
            color="error"
            variant="outline"
            icon="i-lucide-link-2-off"
            :loading="busy"
            :label="t('share.stop')"
            @click="unshare"
          />
        </div>
        <p class="text-sm text-muted">{{ t("share.stopHint") }}</p>
      </div>
      <UButton
        v-else
        icon="i-lucide-link"
        :loading="busy"
        :label="t('share.create')"
        @click="share"
      />
      <p v-if="failure" class="mt-3 text-error" role="alert">{{ failure }}</p>
    </template>
  </UModal>
</template>
