<script setup lang="ts">
import { sources } from "@thereforejs/foods/sources";

const bls = sources["bls-4.0"];
const repository = "https://github.com/Flo0806/nutrition-kitchen";
const license = { name: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" };
</script>

<template>
  <footer class="border-t border-default text-sm text-muted">
    <div class="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-6 sm:px-8">
      <i18n-t keypath="footer.attribution" tag="p" scope="global" data-testid="attribution">
        <template #source>
          <ULink :to="bls.url" target="_blank" class="underline">{{ bls.name }}</ULink>
        </template>
        <template #license>
          <ULink :to="license.url" target="_blank" class="underline">{{ license.name }}</ULink>
        </template>
      </i18n-t>
      <nav class="flex flex-wrap gap-x-5 gap-y-2">
        <ULink to="/sources">{{ $t("footer.sources") }}</ULink>
        <ULink to="/imprint">{{ $t("footer.imprint") }}</ULink>
        <ULink to="/privacy">{{ $t("footer.privacy") }}</ULink>
        <ULink :to="repository" target="_blank">{{ $t("footer.code") }}</ULink>
      </nav>
    </div>
  </footer>
</template>
