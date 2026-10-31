<script setup lang="ts">
import type { Hit } from "@thereforejs/food-finder/de";

const emit = defineEmits<{ pick: [code: string] }>();
const { t } = useI18n();
const { prepare, search } = useFoodFinder();

const query = ref("");
const hits = ref<Hit[]>([]);
const active = ref(-1);
const open = ref(false);
const loading = ref(false);
const listId = useId();

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

function pick(hit: Hit) {
  emit("pick", hit.code);
  query.value = "";
  hits.value = [];
  open.value = false;
}

async function onEnter() {
  const chosen = hits.value[active.value];
  if (open.value && chosen) return pick(chosen);
  // Enter may come before the search of the last keystroke has answered.
  const found = await search(query.value);
  const hit = directHit(found);
  if (hit) return pick(hit);
  hits.value = found;
  open.value = found.length > 0;
  active.value = found.length > 0 ? 0 : -1;
}

function step(delta: number) {
  const count = hits.value.length;
  if (count === 0) return;
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
      :aria-activedescendant="open && active >= 0 ? `${listId}-${active}` : undefined"
      @focus="prepare()"
      @blur="open = false"
      @keydown.down.prevent="step(1)"
      @keydown.up.prevent="step(-1)"
      @keydown.enter.prevent="onEnter"
      @keydown.esc="open = false"
    />
    <ul
      v-show="open && hits.length > 0"
      :id="listId"
      role="listbox"
      :aria-label="t('builder.search.label')"
      class="absolute inset-x-0 z-10 mt-2 overflow-hidden rounded-md border border-default bg-default shadow-lg"
    >
      <li
        v-for="(hit, index) in hits"
        :id="`${listId}-${index}`"
        :key="hit.code"
        role="option"
        :aria-selected="index === active"
        class="cursor-pointer px-4 py-3 text-lg aria-selected:bg-primary/10"
        @mousedown.prevent="pick(hit)"
        @mousemove="active = index"
      >
        {{ hit.name }}
      </li>
    </ul>
    <p v-if="open && !loading && hits.length === 0" role="status" class="mt-2 text-muted">
      {{ t("builder.search.noHits", { query }) }}
    </p>
  </div>
</template>
