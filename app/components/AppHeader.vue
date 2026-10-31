<template>
  <header class="border-b border-default print:hidden">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
      <NuxtLink to="/" class="text-xl font-bold text-highlighted">{{ $t("app.name") }}</NuxtLink>
      <LanguageSwitch />
    </div>
  </header>
</template>
