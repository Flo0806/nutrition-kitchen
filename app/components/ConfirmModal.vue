<script setup lang="ts">
defineProps<{ title: string; description?: string; confirm: string; danger?: boolean }>();
const emit = defineEmits<{ close: [confirmed: boolean] }>();
const { t } = useI18n();
</script>

<template>
  <UModal
    :title="title"
    :description="description"
    @update:open="(open) => !open && emit('close', false)"
  >
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('confirm.cancel')"
          @click="emit('close', false)"
        />
        <UButton
          :color="danger ? 'error' : 'primary'"
          :label="confirm"
          @click="emit('close', true)"
        />
      </div>
    </template>
  </UModal>
</template>
