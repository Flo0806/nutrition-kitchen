<script setup lang="ts">
import { sourceName } from "#shared/utils/material";
import { loginReturnCookie, sharedPath, shareSlug, type SharedRecipe } from "#shared/utils/share";
import type { RecipeRow } from "~/composables/useRecipe";

const { t, n, locale } = useI18n();
const route = useRoute();
const slug = String(route.params.slug);
const { loggedIn } = useUserSession();
const { foods, load } = useFoods();
const describeError = useRequestError();
const toast = useToast();
const returnTo = useCookie(loginReturnCookie, { maxAge: 10 * 60, sameSite: "lax", path: "/" });

// Checked before it becomes part of a request path.
const valid = shareSlug.test(slug);
const { data: recipe, error } = await useFetch<SharedRecipe>(`/api/shared/${slug}`, {
  immediate: valid,
});
if (!valid || error.value || !recipe.value) {
  // The server shows the error page anyway; there `fatal` would log every dead link as a crash.
  throw createError({
    statusCode: 404,
    statusMessage: "Shared recipe not found",
    fatal: import.meta.client,
  });
}
const shared = recipe.value;

const rows = computed<RecipeRow[]>(() => shared.rows.map((row, id) => ({ ...row, id })));
const options = computed(() => shared.options);
provideDeclaration({ rows, options });
onMounted(() => {
  for (const row of shared.rows) if ("code" in row) load(row.code);
});

useHead({ title: shared.title });
// Shared with whoever has the link, not with search engines.
useSeoMeta({ robots: "noindex, nofollow", ogTitle: shared.title });

const language = computed(() => (locale.value === "en" ? "en" : "de"));
const busy = ref(false);

async function copy() {
  busy.value = true;
  try {
    await $fetch(`/api/shared/${slug}/copy`, { method: "POST" });
    toast.add({ title: t("shared.copied"), color: "success" });
    await navigateTo("/book");
  } catch (failure) {
    toast.add({ title: describeError(failure), color: "error" });
  } finally {
    busy.value = false;
  }
}

async function signInToCopy() {
  returnTo.value = sharedPath(slug);
  await navigateTo("/login");
}
</script>

<template>
  <div class="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)]">
    <article class="print:hidden">
      <h1 class="text-4xl leading-tight font-bold">{{ shared.title }}</h1>
      <div class="mt-6 flex flex-wrap gap-3">
        <UButton
          v-if="loggedIn"
          icon="i-lucide-book-plus"
          :loading="busy"
          :label="t('shared.copy')"
          @click="copy"
        />
        <UButton
          v-else
          icon="i-lucide-log-in"
          variant="outline"
          :label="t('shared.copyNeedsLogin')"
          @click="signInToCopy"
        />
      </div>
      <img
        v-if="shared.image"
        :src="`/pictures/${shared.image}`"
        alt=""
        class="mt-8 max-h-96 w-full rounded-md object-cover"
      />
      <h2 class="mt-8 text-2xl font-bold">{{ t("shared.ingredients") }}</h2>
      <ul class="mt-3" data-testid="shared-ingredients">
        <li
          v-for="row in rows"
          :key="row.id"
          class="flex justify-between gap-4 border-b border-default py-2 text-lg"
        >
          <span>{{ sourceName(row, foods, language) ?? "…" }}</span>
          <span class="shrink-0">
            {{
              row.amount === null
                ? t("shared.noAmount")
                : `${n(row.amount, { maximumFractionDigits: 2 })} g`
            }}
          </span>
        </li>
      </ul>
      <p v-if="shared.options.bakingLoss" class="flex justify-between gap-4 py-2 text-lg">
        <span>{{ t("shared.bakingLoss") }}</span>
        <span class="shrink-0"
          >{{ n(shared.options.bakingLoss, { maximumFractionDigits: 2 }) }} g</span
        >
      </p>
      <template v-if="shared.instructions">
        <h2 class="mt-8 text-2xl font-bold">{{ t("shared.instructions") }}</h2>
        <p class="mt-3 text-lg whitespace-pre-line">{{ shared.instructions }}</p>
      </template>
    </article>
    <aside class="lg:sticky lg:top-6 lg:self-start">
      <LabelPanel readonly />
    </aside>
  </div>
</template>
