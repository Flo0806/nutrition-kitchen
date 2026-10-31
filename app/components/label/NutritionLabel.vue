<script setup lang="ts">
import type { LabelTable } from "~/utils/labelText";

defineProps<{ table: LabelTable; lang: string }>();
</script>

<template>
  <figure class="nutrition-label" :lang="lang" data-testid="label">
    <table class="w-full">
      <caption>
        {{
          table.title
        }}
      </caption>
      <thead>
        <tr>
          <td />
          <th scope="col">{{ table.columns.per100g }}</th>
          <th v-if="table.columns.perPiece" scope="col">{{ table.columns.perPiece }}</th>
          <th v-if="table.columns.referenceIntake" scope="col">
            {{ table.columns.referenceIntake }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in table.rows" :key="row.key" :class="{ sub: row.sub }">
          <th scope="row">{{ row.label }}</th>
          <LabelValue :cell="row.per100g" />
          <LabelValue v-if="table.columns.perPiece" :cell="row.perPiece" />
          <LabelValue v-if="table.columns.referenceIntake" :cell="row.referenceIntake" />
        </tr>
      </tbody>
    </table>
    <figcaption v-if="table.statement">{{ table.statement }}</figcaption>
  </figure>
</template>

<style scoped>
.nutrition-label {
  background: var(--label-paper);
  color: #000;
  border: 2px solid var(--label-rule);
  padding: 0.75rem 1rem 1rem;
  font-family: var(--font-label);
  font-variant-numeric: tabular-nums;
}

caption {
  text-align: left;
  font-size: 1.5rem;
  font-weight: 800;
  padding-bottom: 0.25rem;
  border-bottom: 6px solid var(--label-rule);
}

th,
td {
  padding: 0.3rem 0;
  text-align: right;
  border-bottom: 1px solid var(--label-rule);
}

thead th {
  font-weight: 700;
  font-size: 0.9rem;
  vertical-align: bottom;
  padding-left: 0.75rem;
}

tbody th {
  text-align: left;
  font-weight: 600;
}

tbody tr.sub th {
  font-weight: 400;
  padding-left: 0.75rem;
}

tbody :deep(td) {
  padding-left: 0.75rem;
  white-space: nowrap;
}

tbody tr:last-child th,
tbody tr:last-child :deep(td) {
  border-bottom: none;
}

figcaption {
  margin-top: 0.75rem;
  font-size: 0.85rem;
}
</style>
