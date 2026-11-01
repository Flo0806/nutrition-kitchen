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

.legal-text :slotted(ul) {
  margin-top: 0.75rem;
  padding-left: 1.25rem;
  list-style: disc;
  line-height: 1.6;
}

.legal-text :slotted(li + li) {
  margin-top: 0.5rem;
}

.legal-text :slotted(a) {
  text-decoration: underline;
}
</style>
