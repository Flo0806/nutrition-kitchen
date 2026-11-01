<script setup lang="ts">
import type { Hit } from "@thereforejs/food-finder/de";

const emit = defineEmits<{ pick: [code: string]; custom: [name: string] }>();
const { t } = useI18n();
const { prepare, search } = useFoodFinder();

const query = ref("");
const hits = ref<Hit[]>([]);
const active = ref(-1);
const open = ref(false);
const loading = ref(false);
const listId = useId();

// The last option is always "add as own raw material": partial hits make an empty list rare, so an
// offer only for no hits would hardly ever show.
const customIndex = computed(() => hits.value.length);
// Then "report it": what people miss is what the search learns next.
const reportIndex = computed(() => hits.value.length + 1);
const optionId = (index: number) => `${listId}-${index}`;

// Searches can overtake each other while the names load; only the newest may show.
let latest = 0;
watch(query, async (value) => {
  const ticket = ++latest;
  loading.value = true;
  const found = await search(value);
  if (ticket !== latest) return;
  loading.value = false;
  hits.value = found;
  active.value = -1;
  open.value = value.trim() !== "";
});

function reset() {
  query.value = "";
  hits.value = [];
  open.value = false;
}

function choose(index: number) {
  const hit = hits.value[index];
  const search = query.value.trim();
  if (hit) emit("pick", hit.code);
  else if (index === reportIndex.value) {
    reset();
    return navigateTo({ path: "/feedback", query: { kind: "missingFood", search } });
  } else emit("custom", search);
  reset();
}

async function onEnter() {
  if (open.value && active.value >= 0) return choose(active.value);
  if (!query.value.trim()) return;
  // Enter may come before the search of the last keystroke has answered.
  const found = await search(query.value);
  const hit = directHit(found);
  if (hit) {
    emit("pick", hit.code);
    return reset();
  }
  hits.value = found;
  open.value = true;
  active.value = 0;
}

function step(delta: number) {
  if (!query.value.trim()) return;
  const count = hits.value.length + 2;
  open.value = true;
  active.value = (active.value + delta + count) % count;
}
</script>

<template>
  <div class="relative">
    <label :for="searchInputId" class="text-lg font-bold">{{ t("builder.search.label") }}</label>
    <UInput
      :id="searchInputId"
      v-model="query"
      class="mt-2 w-full"
      size="xl"
      icon="i-lucide-search"
      :placeholder="t('builder.search.placeholder')"
      autocomplete="off"
      role="combobox"
      aria-autocomplete="list"
      :aria-expanded="open"
      :aria-controls="listId"
      :aria-activedescendant="open && active >= 0 ? optionId(active) : undefined"
      @focus="prepare()"
      @blur="open = false"
      @keydown.down.prevent="step(1)"
      @keydown.up.prevent="step(-1)"
      @keydown.enter.prevent="onEnter"
      @keydown.esc="open = false"
    />
    <div
      v-show="open && !loading"
      class="absolute inset-x-0 z-10 mt-2 overflow-hidden rounded-md border border-default bg-default shadow-lg"
    >
      <p v-if="hits.length === 0" role="status" class="px-4 pt-3 text-muted">
        {{ t("builder.search.noHits", { query: query.trim() }) }}
      </p>
      <!-- A mistyped word read as the nearest known one: say so, or the hits look unrelated. -->
      <p v-else-if="hits[0]?.match === 'fuzzy'" role="status" class="px-4 pt-3 text-muted">
        {{ t("builder.search.similar", { query: query.trim() }) }}
      </p>
      <ul :id="listId" role="listbox" :aria-label="t('builder.search.label')">
        <li
          v-for="(hit, index) in hits"
          :id="optionId(index)"
          :key="hit.code"
          role="option"
          :aria-selected="index === active"
          class="cursor-pointer px-4 py-3 text-lg aria-selected:bg-primary/10"
          @mousedown.prevent="choose(index)"
          @mousemove="active = index"
        >
          {{ hit.name }}
        </li>
        <li
          :id="optionId(customIndex)"
          role="option"
          :aria-selected="customIndex === active"
          class="flex cursor-pointer items-center gap-2 border-t border-default px-4 py-3 text-lg text-primary aria-selected:bg-primary/10"
          @mousedown.prevent="choose(customIndex)"
          @mousemove="active = customIndex"
        >
          <UIcon name="i-lucide-plus" aria-hidden="true" />
          {{ t("material.fromSearch", { query: query.trim() }) }}
        </li>
        <li
          :id="optionId(reportIndex)"
          role="option"
          :aria-selected="reportIndex === active"
          class="flex cursor-pointer items-center gap-2 border-t border-default px-4 py-3 text-muted aria-selected:bg-primary/10"
          @mousedown.prevent="choose(reportIndex)"
          @mousemove="active = reportIndex"
        >
          <UIcon name="i-lucide-message-square-warning" aria-hidden="true" />
          {{ t("feedback.fromSearch", { query: query.trim() }) }}
        </li>
      </ul>
    </div>
  </div>
</template>
