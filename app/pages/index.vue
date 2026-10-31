<script setup lang="ts">
const { add } = useRecipe();
useRecipeDraft();
provideDeclaration();

async function onPick(code: string) {
  const row = add(code);
  await nextTick();
  focusById(amountInputId(row.id));
}
</script>

<template>
  <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]">
    <div class="print:hidden">
      <h1 class="text-4xl leading-tight font-bold">{{ $t("app.tagline") }}</h1>
      <BuilderFoodSearch class="mt-8" @pick="onPick" />
      <BuilderIngredientList class="mt-6" />
    </div>
    <aside class="lg:sticky lg:top-6 lg:self-start">
      <LabelPanel />
    </aside>
  </div>
</template>
