<template>
  <header class="border-b border-default print:hidden">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
      <NuxtLink to="/" class="flex min-w-0 items-center gap-3 text-highlighted">
        <img src="/favicon.svg" alt="" width="40" height="40" class="size-9 shrink-0 sm:size-10" />
        <span class="font-label text-lg leading-tight font-bold tracking-tight sm:text-2xl">
          {{ $t("app.name") }}
        </span>
      </NuxtLink>
      <div class="flex items-center gap-3">
        <LanguageSwitch />
        <UserMenu />
      </div>
    </div>
  </header>
</template>
