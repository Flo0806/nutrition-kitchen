<template>
  <div class="flex min-h-dvh flex-col">
    <AppHeader />
    <main class="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
