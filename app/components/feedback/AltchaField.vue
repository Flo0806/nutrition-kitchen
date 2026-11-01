<script setup lang="ts">
const payload = defineModel<string>();
const { locale } = useI18n();
let verified = false;
const widget = useTemplateRef<HTMLElement & { reset: () => void }>("widget");

onMounted(async () => {
  await Promise.all([import("altcha"), import("altcha/i18n/de"), import("altcha/i18n/en")]);
});

function onStateChange(event: Event) {
  const { state, payload: value } = (event as CustomEvent<{ state: string; payload?: string }>)
    .detail;
  verified = state === "verified";
  payload.value = verified ? value : undefined;
}

// A solution is single use: a failed send needs a fresh one.
watch(payload, (value) => {
  if (!value && verified) widget.value?.reset();
});
</script>

<template>
  <altcha-widget
    ref="widget"
    challenge="/api/feedback/challenge"
    auto="onfocus"
    :language="locale"
    configuration='{"hideLogo":true,"hideFooter":true}'
    class="altcha"
    @statechange="onStateChange"
  />
</template>

<style scoped>
.altcha {
  --altcha-color-base: var(--ui-bg);
  --altcha-color-base-content: var(--ui-text);
  --altcha-color-primary: var(--ui-primary);
  --altcha-color-primary-content: var(--ui-bg);
  --altcha-color-success: var(--ui-success);
  --altcha-color-error: var(--ui-error);
  --altcha-border-color: var(--ui-border);
  --altcha-border-radius: calc(var(--ui-radius) * 2);
  --altcha-max-width: 100%;
  --altcha-shadow: none;
  display: block;
}
</style>
