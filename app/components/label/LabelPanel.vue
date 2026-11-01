<script setup lang="ts">
import { labelLocales, labelTable, labelText, type LabelLanguage } from "~/utils/labelText";
import { sourceName } from "#shared/utils/material";

const { t, locale } = useI18n();
const declared = useDeclaration();
const { rows, options } = useRecipe();
const { foods } = useFoods();
const { describeProblem } = useLabelText();
const toast = useToast();

const uiLanguage = computed<LabelLanguage>(() => (locale.value === "en" ? "en" : "de"));
const labelLanguage = ref<LabelLanguage>(uiLanguage.value);
watch(uiLanguage, (value) => (labelLanguage.value = value));
const otherLanguage = computed<LabelLanguage>(() => (labelLanguage.value === "de" ? "en" : "de"));

const table = computed(() =>
  declared.value.state === "declared"
    ? labelTable(declared.value.result, labelLanguage.value, options.value.pieceWeight)
    : undefined,
);

const rowName = (id: number) => {
  const row = rows.value.find((candidate) => candidate.id === id);
  return (row && sourceName(row, foods.value, uiLanguage.value)) ?? "";
};
const rowNumber = (id: number) => rows.value.findIndex((row) => row.id === id) + 1;

const withoutAmount = computed(() =>
  "withoutAmount" in declared.value
    ? declared.value.withoutAmount.map(rowName).filter(Boolean)
    : [],
);

function print() {
  window.print();
}

async function copy() {
  if (!table.value) return;
  await navigator.clipboard.writeText(labelText(table.value));
  toast.add({ title: t("label.copied"), color: "success" });
}
</script>

<template>
  <section class="label-panel" :aria-label="t('label.options.title')">
    <div class="mb-3 flex flex-wrap gap-2 print:hidden">
      <UButton
        icon="i-lucide-languages"
        color="neutral"
        variant="outline"
        :label="t('label.flip', { language: t(`label.languages.${otherLanguage}`) })"
        :disabled="!table"
        @click="labelLanguage = otherLanguage"
      />
      <UButton
        icon="i-lucide-printer"
        color="neutral"
        variant="outline"
        :label="t('label.print')"
        :disabled="!table"
        @click="print"
      />
      <UButton
        icon="i-lucide-copy"
        color="neutral"
        variant="outline"
        :label="t('label.copy')"
        :disabled="!table"
        @click="copy"
      />
    </div>

    <div class="label-stage" aria-live="polite">
      <Transition name="flip" mode="out-in">
        <LabelNutritionLabel
          v-if="table"
          :key="labelLanguage"
          :table="table"
          :lang="labelLocales[labelLanguage].locale"
        />
        <div v-else-if="declared.state === 'refused'" class="rounded-md border border-error p-4">
          <p class="font-bold">{{ t("label.refused") }}</p>
          <ul class="mt-2 list-disc pl-5" data-testid="problems">
            <li v-for="(problem, index) in declared.problems" :key="index">
              {{
                problem.rowId === undefined
                  ? describeProblem(problem.diagnostic)
                  : t("label.row", {
                      number: rowNumber(problem.rowId),
                      text: describeProblem(problem.diagnostic),
                    })
              }}
            </li>
          </ul>
        </div>
        <!-- About the height of a label, so nothing below jumps when the values arrive. -->
        <p
          v-else-if="declared.state === 'bakingLoss'"
          class="rounded-md border border-error p-4"
          data-testid="problems"
        >
          {{ t("label.bakingLoss") }}
        </p>
        <p
          v-else
          class="flex min-h-96 items-center justify-center rounded-md border border-dashed border-default p-6 text-center text-muted"
        >
          {{ declared.state === "loading" ? t("label.loading") : t("label.empty") }}
        </p>
      </Transition>
    </div>

    <p v-if="withoutAmount.length > 0" class="mt-3 text-sm print:hidden">
      {{ t("label.withoutAmount", { names: withoutAmount.join(", ") }) }}
    </p>

    <LabelOptions class="mt-8 print:hidden" />
  </section>
</template>

<style scoped>
.label-stage {
  perspective: 1200px;
}

.flip-enter-active,
.flip-leave-active {
  transition: transform 0.22s ease-in-out;
}

.flip-leave-to {
  transform: rotateY(90deg);
}

.flip-enter-from {
  transform: rotateY(-90deg);
}

@media (prefers-reduced-motion: reduce) {
  .flip-enter-active,
  .flip-leave-active {
    transition: none;
  }
}
</style>
