<script setup lang="ts">
import { sources } from "@thereforejs/foods/sources";

const { t } = useI18n();
useHead({ title: () => t("sources.title") });
</script>

<template>
  <article class="max-w-prose">
    <h1 class="text-3xl font-bold">{{ $t("sources.title") }}</h1>
    <p class="mt-3">{{ $t("sources.intro") }}</p>
    <ul class="mt-8 flex flex-col gap-6">
      <li v-for="(source, id) in sources" :key="id">
        <h2 class="text-lg font-bold">
          <ULink :to="source.url" target="_blank" raw class="underline">{{ source.name }}</ULink>
        </h2>
        <p class="mt-1">{{ source.citation }}</p>
        <p class="mt-1 text-sm text-muted">{{ $t("sources.license") }}: {{ source.license }}</p>
      </li>
    </ul>
  </article>
</template>
