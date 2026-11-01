<script setup lang="ts">
import { isWater } from "#shared/utils/bakingLoss";

const props = defineProps<{ total: number }>();
const { t, n } = useI18n();
const { rows, options } = useRecipe();
const declared = useDeclaration();

const hasWater = computed(() => rows.value.some(isWater));
const loss = computed({
  get: () => options.value.bakingLoss,
  set: (value) => (options.value.bakingLoss = value),
});
const grams = (value: number) => n(value, { maximumFractionDigits: 2 });
const afterBaking = computed(() => Math.round((props.total - (loss.value ?? 0)) * 1e6) / 1e6);

const problem = computed(() => {
  if (declared.value.state !== "bakingLoss") return "";
  return declared.value.problem === "noWater"
    ? t("builder.bakingLoss.noWater")
    : t("builder.bakingLoss.exceedsWater", {
        loss: grams(loss.value ?? 0),
        water: grams(declared.value.water),
      });
});
</script>

<template>
  <div
    class="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-t border-default py-4"
  >
    <div>
      <label for="baking-loss" class="font-bold">{{ t("builder.bakingLoss.label") }}</label>
      <div class="mt-2 flex items-start gap-2">
        <!-- Stays usable with a value, so a loss left over after removing the water can be cleared. -->
        <BuilderAmountField
          id="baking-loss"
          v-model="loss"
          :label="t('builder.bakingLoss.label')"
          :disabled="!hasWater && !loss"
        />
        <span class="mt-2 text-lg" aria-hidden="true">g</span>
      </div>
      <p v-if="problem" class="mt-1 text-sm text-error" data-testid="baking-problem">
        {{ problem }}
      </p>
      <p v-else class="mt-1 text-sm text-muted">
        {{ hasWater ? t("builder.bakingLoss.hint") : t("builder.bakingLoss.noWater") }}
      </p>
    </div>
    <p v-if="loss && !problem" class="flex gap-3 text-lg" data-testid="after-baking">
      <span>{{ t("builder.bakingLoss.afterBaking") }}</span>
      <span class="font-bold">{{ grams(afterBaking) }} g</span>
    </p>
  </div>
</template>
