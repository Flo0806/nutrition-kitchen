<template>
  <div class="legal-text">
    <slot />
  </div>
</template>

<style scoped>
.legal-text :slotted(h1) {
  font-size: var(--text-3xl);
  font-weight: 700;
}

.legal-text :slotted(h2) {
  margin-top: 2rem;
  font-size: var(--text-xl);
  font-weight: 700;
}

.legal-text :slotted(p) {
  margin-top: 0.75rem;
  line-height: 1.6;
}

/* Placeholders stay loud until the real data is in. */
.legal-text :slotted(mark) {
  background: var(--color-yolk-200);
  color: inherit;
  padding: 0 0.2em;
}
</style>
