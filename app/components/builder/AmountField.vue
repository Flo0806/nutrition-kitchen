<script setup lang="ts">
import { formatAmount, parseAmount } from "~/utils/amount";
import { maxAmount } from "#shared/utils/recipe";

const props = defineProps<{ id: string; label: string; disabled?: boolean }>();
const amount = defineModel<number | null>({ required: true });
const { t, locale } = useI18n();
const language = computed(() => (locale.value === "en" ? "en" : "de"));
const step = 10;

const text = ref(formatAmount(amount.value, language.value));
const invalid = ref(false);
const hintId = computed(() => `${props.id}-hint`);

// Every keystroke counts at once, so the label follows the typing.
watch(text, (value) => {
  const parsed = parseAmount(value, language.value);
  invalid.value = parsed === "invalid";
  amount.value = parsed === "invalid" ? null : parsed;
});

// Changes from outside (steppers, a restored draft) rewrite the text; typing itself does not.
watch(amount, (value) => {
  const shown = parseAmount(text.value, language.value);
  if (shown !== value && !(shown === "invalid" && value === null)) {
    text.value = formatAmount(value, language.value);
  }
});

watch(language, (value) => {
  if (!invalid.value) text.value = formatAmount(amount.value, value);
});

function stepBy(delta: number) {
  const next = Math.round(((amount.value ?? 0) + delta) * 100) / 100;
  amount.value = Math.min(maxAmount, Math.max(0, next));
}

function tidy() {
  if (!invalid.value) text.value = formatAmount(amount.value, language.value);
}
</script>

<template>
  <div>
    <UFieldGroup size="xl">
      <UButton
        icon="i-lucide-minus"
        color="neutral"
        variant="outline"
        :aria-label="t('builder.amount.less', { step })"
        :disabled="disabled || !amount"
        @click="stepBy(-step)"
      />
      <UInput
        :id="id"
        v-model="text"
        class="w-28"
        :ui="{ base: 'text-center' }"
        inputmode="decimal"
        autocomplete="off"
        :color="invalid ? 'error' : 'primary'"
        :highlight="invalid"
        :aria-label="label"
        :disabled="disabled"
        :aria-invalid="invalid"
        :aria-describedby="invalid ? hintId : undefined"
        @blur="tidy"
      />
      <UButton
        icon="i-lucide-plus"
        color="neutral"
        variant="outline"
        :aria-label="t('builder.amount.more', { step })"
        :disabled="disabled"
        @click="stepBy(step)"
      />
    </UFieldGroup>
    <p v-if="invalid" :id="hintId" class="mt-1 text-sm text-error">
      {{ t("builder.amount.invalid") }}
    </p>
  </div>
</template>
