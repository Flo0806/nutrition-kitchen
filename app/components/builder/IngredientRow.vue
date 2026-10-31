<script setup lang="ts">
import type { RecipeRow } from "~/composables/useRecipe";

const props = defineProps<{ row: RecipeRow; index: number }>();
const { t, locale } = useI18n();
const { foods, failed, load } = useFoods();
const { remove, setAmount, move } = useRecipe();
const declared = useDeclaration();
const { describeGap, describeProblem } = useLabelText();

// What the label says about this row: refusals first, they stop the whole label.
const problems = computed(() =>
  declared.value.state === "refused"
    ? declared.value.problems
        .filter((problem) => problem.rowId === props.row.id)
        .map((problem) => describeProblem(problem.diagnostic))
    : [],
);
const gap = computed(() => {
  if (declared.value.state !== "declared") return "";
  const found = declared.value.gaps.find((candidate) => candidate.rowId === props.row.id);
  return found ? describeGap(food.value, found.nutrients) : "";
});

const food = computed(() => foods.value[props.row.code]);
const name = computed(() => food.value?.name[locale.value === "en" ? "en" : "de"] ?? "");
const amount = computed({
  get: () => props.row.amount,
  set: (value) => setAmount(props.row.id, value ?? null),
});

async function moveBy(delta: number) {
  move(props.index, props.index + delta);
  // Moving a node in the DOM can drop its focus.
  await nextTick();
  focusById(moveHandleId(props.row.id));
}
</script>

<template>
  <li class="ingredient-row grid items-center gap-x-3 gap-y-2 border-b border-default py-3">
    <UButton
      :id="moveHandleId(row.id)"
      class="drag-handle cursor-grab [grid-area:handle]"
      icon="i-lucide-grip-vertical"
      color="neutral"
      variant="ghost"
      size="lg"
      :aria-label="t('builder.row.move', { name })"
      @keydown.up.prevent="moveBy(-1)"
      @keydown.down.prevent="moveBy(1)"
    />
    <div class="min-w-0 [grid-area:name]">
      <p v-if="food" class="text-lg leading-snug font-bold">{{ name }}</p>
      <p v-else-if="failed[row.code]" class="text-error">
        {{ t("builder.row.loadFailed") }}
        <UButton variant="link" :label="t('builder.row.retry')" @click="load(row.code)" />
      </p>
      <USkeleton v-else class="h-6 w-48" />
    </div>
    <div class="flex items-start gap-2 [grid-area:amount]">
      <BuilderAmountField
        :id="amountInputId(row.id)"
        v-model="amount"
        :label="t('builder.row.amount', { name })"
        @keydown.enter.prevent="focusById(searchInputId)"
      />
      <span class="mt-2 text-lg" aria-hidden="true">g</span>
    </div>
    <UButton
      class="[grid-area:remove]"
      icon="i-lucide-x"
      color="neutral"
      variant="ghost"
      size="lg"
      :aria-label="t('builder.row.remove', { name })"
      @click="remove(row.id)"
    />
    <div v-if="problems.length > 0 || gap" class="text-sm [grid-area:note]" data-testid="row-note">
      <p v-for="problem in problems" :key="problem" class="text-error">{{ problem }}</p>
      <p v-if="gap" class="text-muted">{{ gap }}</p>
    </div>
  </li>
</template>

<style scoped>
.ingredient-row {
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas:
    "handle name remove"
    ". amount amount"
    ". note note";
}

@media (min-width: 40rem) {
  .ingredient-row {
    grid-template-columns: auto minmax(0, 1fr) auto auto;
    grid-template-areas:
      "handle name amount remove"
      ". note note .";
  }
}
</style>
