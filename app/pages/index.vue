<script setup lang="ts">
import type { Source } from "#shared/utils/source";

const { add } = useRecipe();
const askMaterial = useMaterialForm();
useRecipeDraft();
provideDeclaration();

async function addAndFocus(source: Source) {
  const row = add(source);
  await nextTick();
  focusById(amountInputId(row.id));
}

async function addCustom(name = "") {
  const custom = await askMaterial({ name });
  if (custom) await addAndFocus({ custom });
}
</script>

<template>
  <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]">
    <div class="print:hidden">
      <h1 class="text-4xl leading-tight font-bold">{{ $t("app.tagline") }}</h1>
      <BuilderFoodSearch class="mt-8" @pick="(code) => addAndFocus({ code })" @custom="addCustom" />
      <UButton
        class="mt-3"
        icon="i-lucide-clipboard-list"
        color="neutral"
        variant="outline"
        :label="$t('material.open')"
        @click="addCustom()"
      />
      <BuilderIngredientList class="mt-6" />
    </div>
    <aside class="lg:sticky lg:top-6 lg:self-start">
      <LabelPanel />
    </aside>
  </div>
</template>
