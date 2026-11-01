<script setup lang="ts">
import type { BookEntry } from "~/composables/useRecipeBook";

definePageMeta({ middleware: "auth" });

const { t, locale } = useI18n();
useHead({ title: () => t("book.title") });
const { saved, rows } = useRecipe();
const { openSaved, remove } = useRecipeBook();
const describeError = useRequestError();
const confirm = useConfirm();
const toast = useToast();

const { data: entries, refresh } = await useFetch<BookEntry[]>("/api/recipes", {
  default: () => [],
});
const energyKey = computed(() => (locale.value === "en" ? "en-GB" : "de-DE"));

async function openEntry(entry: BookEntry) {
  const replaces = rows.value.length > 0 && saved.value?.id !== entry.id;
  if (replaces) {
    const ok = await confirm({
      title: t("book.replaceConfirm", { title: entry.title }),
      confirm: t("book.open"),
    });
    if (!ok) return;
  }
  try {
    await openSaved(entry.id);
    await navigateTo("/");
  } catch (error) {
    toast.add({ title: describeError(error), color: "error" });
  }
}

async function deleteEntry(entry: BookEntry) {
  const ok = await confirm({
    title: t("book.deleteConfirm", { title: entry.title }),
    description: t("book.deleteFinal"),
    confirm: t("book.delete"),
    danger: true,
  });
  if (!ok) return;
  try {
    await remove(entry.id);
    await refresh();
    toast.add({ title: t("book.deleted"), color: "success" });
  } catch (error) {
    toast.add({ title: describeError(error), color: "error" });
  }
}
</script>

<template>
  <section>
    <h1 class="text-3xl font-bold">{{ t("book.title") }}</h1>
    <p v-if="entries.length === 0" class="mt-6 text-lg text-muted">{{ t("book.empty") }}</p>
    <ul v-else class="mt-8 flex flex-col">
      <li
        v-for="entry in entries"
        :key="entry.id"
        class="flex items-center gap-4 border-b border-default py-4"
        data-testid="book-entry"
      >
        <img
          v-if="entry.image"
          :src="`/pictures/${entry.image}`"
          alt=""
          class="size-20 shrink-0 rounded-md object-cover"
        />
        <div v-else class="size-20 shrink-0 rounded-md bg-elevated" aria-hidden="true" />
        <div class="min-w-0 flex-1">
          <h2 class="text-lg font-bold">{{ entry.title }}</h2>
          <p class="text-muted">
            {{
              entry.energy ? `${entry.energy[energyKey]} ${t("book.per100g")}` : t("book.noEnergy")
            }}
          </p>
        </div>
        <UButton
          :label="t('book.open')"
          :aria-label="t('book.openNamed', { title: entry.title })"
          @click="openEntry(entry)"
        />
        <UButton
          icon="i-lucide-trash-2"
          color="neutral"
          variant="ghost"
          :aria-label="t('book.deleteNamed', { title: entry.title })"
          @click="deleteEntry(entry)"
        />
      </li>
    </ul>
  </section>
</template>
