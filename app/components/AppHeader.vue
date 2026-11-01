<template>
  <header class="border-b border-default print:hidden">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
      <NuxtLink to="/" class="text-xl font-bold text-highlighted">{{ $t("app.name") }}</NuxtLink>
      <div class="flex items-center gap-3">
        <LanguageSwitch />
        <UserMenu />
      </div>
    </div>
  </header>
</template>
