<script setup lang="ts">
const { add } = useRecipe();
useRecipeDraft();

async function onPick(code: string) {
  const row = add(code);
  await nextTick();
  focusById(amountInputId(row.id));
}
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-4xl leading-tight font-bold">{{ $t("app.tagline") }}</h1>
    <BuilderFoodSearch class="mt-8" @pick="onPick" />
    <BuilderIngredientList class="mt-6" />
  </div>
</template>
