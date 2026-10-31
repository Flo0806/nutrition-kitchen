<script setup lang="ts">
import type { LabelCell } from "~/utils/labelText";

const props = defineProps<{ cell: LabelCell | undefined }>();
const key = computed(() => props.cell?.join("|"));
</script>

<template>
  <td>
    <Transition name="value" mode="out-in">
      <span :key="key" class="inline-flex flex-col items-end">
        <span v-for="line in cell" :key="line">{{ line }}</span>
      </span>
    </Transition>
  </td>
</template>

<style scoped>
/* A changed value lights up briefly, so the eye finds what the last keystroke did. */
.value-enter-active {
  transition:
    opacity 0.18s ease-out,
    background-color 0.9s ease-out;
}

.value-enter-from {
  opacity: 0;
  background-color: var(--color-yolk-300);
}

.value-leave-active {
  transition: opacity 0.08s ease-in;
}

.value-leave-to {
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .value-enter-active,
  .value-leave-active {
    transition: none;
  }
}
</style>
