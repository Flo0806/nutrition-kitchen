<script setup lang="ts">
import { parseDecimal } from "~/utils/amount";
import {
  materialNutrients,
  type CustomMaterial,
  type MaterialNutrient,
} from "#shared/utils/source";
import { checkMaterial } from "~/utils/material";
import { labelLocales } from "~/utils/labelText";

const props = defineProps<{ initial?: { name?: string; per100g?: CustomMaterial["per100g"] } }>();
const emit = defineEmits<{ close: [material: CustomMaterial | undefined] }>();

const { t, locale } = useI18n();
const { describeProblem } = useLabelText();
const language = computed(() => (locale.value === "en" ? "en" : "de"));
const labels = computed(() => labelLocales[language.value].labels);
const subRows = new Set<MaterialNutrient>(["saturates", "sugars"]);

// Stored values are decimal text ("12.5"); the form shows the language's decimal mark.
const shown = (value: string | null | undefined) =>
  value ? (language.value === "de" ? value.replace(".", ",") : value) : "";

const name = ref(props.initial?.name ?? "");
const values = reactive(
  Object.fromEntries(
    materialNutrients.map((key) => [key, shown(props.initial?.per100g?.[key])]),
  ) as Record<MaterialNutrient, string>,
);
const errors = reactive<Partial<Record<MaterialNutrient | "name" | "form", string>>>({});

function fieldLabel(key: MaterialNutrient) {
  return subRows.has(key) ? `${labels.value.ofWhich} ${labels.value[key]}` : labels.value[key];
}

function submit() {
  for (const key of Object.keys(errors)) delete errors[key as keyof typeof errors];
  if (!name.value.trim()) errors.name = t("material.nameRequired");

  const per100g = {} as CustomMaterial["per100g"];
  for (const key of materialNutrients) {
    const parsed = parseDecimal(values[key], language.value);
    if (parsed === "invalid") errors[key] = t("material.invalid");
    per100g[key] = parsed === "invalid" ? null : parsed;
  }
  if (Object.keys(errors).length > 0) return;

  for (const { field, diagnostic } of checkMaterial(per100g)) {
    errors[field ?? "form"] = describeProblem(diagnostic);
  }
  if (Object.keys(errors).length > 0) return;

  added = true;
  emit("close", { name: name.value.trim(), per100g });
}

// After adding, the caller moves the focus to the new row; the dialog must not take it back.
let added = false;
function onCloseAutoFocus(event: Event) {
  if (added) event.preventDefault();
}
</script>

<template>
  <UModal
    :title="initial?.per100g ? t('material.editTitle') : t('material.title')"
    :description="t('material.hint')"
    :content="{ onCloseAutoFocus }"
    @update:open="(open) => !open && emit('close', undefined)"
  >
    <template #body>
      <form id="material-form" class="flex flex-col gap-4" novalidate @submit.prevent="submit">
        <UFormField :label="t('material.name')" :error="errors.name" required>
          <UInput
            v-model="name"
            class="w-full"
            size="lg"
            maxlength="120"
            :placeholder="t('material.namePlaceholder')"
            autofocus
          />
        </UFormField>
        <div class="grid gap-3 sm:grid-cols-2">
          <UFormField
            v-for="key in materialNutrients"
            :key="key"
            :label="fieldLabel(key)"
            :hint="key === 'fibre' ? t('material.optional') : undefined"
            :error="errors[key]"
          >
            <UInput
              v-model="values[key]"
              class="w-full"
              size="lg"
              inputmode="decimal"
              autocomplete="off"
              :ui="{ trailing: 'pointer-events-none' }"
            >
              <template #trailing><span class="text-muted">g</span></template>
            </UInput>
          </UFormField>
        </div>
        <p v-if="errors.form" class="text-error">{{ errors.form }}</p>
      </form>
    </template>
    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          :label="t('material.cancel')"
          @click="emit('close', undefined)"
        />
        <UButton
          type="submit"
          form="material-form"
          :label="initial?.per100g ? t('material.save') : t('material.add')"
        />
      </div>
    </template>
  </UModal>
</template>
