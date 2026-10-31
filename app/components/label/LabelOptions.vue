<script setup lang="ts">
import type { Voluntary } from "@thereforejs/nutrition";
import { labelLocales } from "~/utils/labelText";

const { t, locale } = useI18n();
const { options } = useRecipe();
const voluntary: Voluntary[] = ["monounsaturates", "polyunsaturates", "polyols", "starch", "fibre"];
const labels = computed(() => labelLocales[locale.value === "en" ? "en" : "de"].labels);

const pieceWeight = computed({
  get: () => options.value.pieceWeight,
  set: (value) => (options.value.pieceWeight = value),
});

function toggle(key: Voluntary, on: boolean | "indeterminate") {
  const rest = options.value.voluntary.filter((item) => item !== key);
  options.value.voluntary = on === true ? [...rest, key] : rest;
}
</script>

<template>
  <section class="flex flex-col gap-5" :aria-label="t('label.options.title')">
    <div>
      <label for="piece-weight" class="font-bold">{{ t("label.options.pieceWeight") }}</label>
      <div class="mt-2 flex items-start gap-2">
        <BuilderAmountField
          id="piece-weight"
          v-model="pieceWeight"
          :label="t('label.options.pieceWeight')"
        />
        <span class="mt-2 text-lg" aria-hidden="true">g</span>
      </div>
    </div>
    <fieldset>
      <legend class="font-bold">{{ t("label.options.voluntary") }}</legend>
      <div class="mt-2 flex flex-col gap-2">
        <UCheckbox
          v-for="key in voluntary"
          :key="key"
          size="lg"
          :label="labels[key]"
          :model-value="options.voluntary.includes(key)"
          @update:model-value="toggle(key, $event)"
        />
      </div>
    </fieldset>
    <USwitch
      v-model="options.referenceIntake"
      size="lg"
      :label="t('label.options.referenceIntake')"
    />
  </section>
</template>
