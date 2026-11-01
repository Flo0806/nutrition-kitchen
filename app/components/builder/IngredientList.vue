<script setup lang="ts">
import { useSortable } from "@vueuse/integrations/useSortable";

const { t, n } = useI18n();
const { rows } = useRecipe();
const list = useTemplateRef<HTMLElement>("list");

useSortable(list, rows, { handle: ".drag-handle", animation: 150 });

const total = computed(() => rows.value.reduce((sum, row) => sum + (row.amount ?? 0), 0));
</script>

<template>
  <section :aria-label="t('builder.rows.label')">
    <p v-if="rows.length === 0" class="py-8 text-lg text-muted">{{ t("builder.rows.empty") }}</p>
    <ul ref="list">
      <BuilderIngredientRow v-for="(row, index) in rows" :key="row.id" :row="row" :index="index" />
    </ul>
    <p v-if="rows.length > 0" class="flex justify-end gap-3 py-3 text-lg" data-testid="total">
      <span>{{ t("builder.rows.total") }}</span>
      <span class="font-bold">{{ n(total, { maximumFractionDigits: 2 }) }} g</span>
    </p>
    <BuilderBakingLoss v-if="rows.length > 0" :total="total" />
  </section>
</template>
