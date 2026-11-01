<script setup lang="ts">
import {
  feedbackInput,
  feedbackKinds,
  feedbackMessage,
  type FeedbackKind,
} from "#shared/utils/feedback";

const { t } = useI18n();
const route = useRoute();
useHead({ title: () => t("feedback.title") });

const fromQuery = (value: unknown) => (typeof value === "string" ? value.slice(0, 120) : "");
const search = fromQuery(route.query.search);
const kind = ref<FeedbackKind>(
  feedbackKinds.find((candidate) => candidate === route.query.kind) ?? "missingFood",
);
const message = ref(search ? t("feedback.prefill", { search }) : "");
const email = ref("");
const website = ref("");
const altcha = ref<string>();
const messageError = ref("");
const failure = ref("");
const busy = ref(false);
const sent = ref(false);
const describeError = useRequestError();

const kinds = computed(() =>
  feedbackKinds.map((value) => ({ value, label: t(`feedback.kinds.${value}`) })),
);

async function submit() {
  messageError.value = feedbackMessage.safeParse(message.value).success
    ? ""
    : t("feedback.messageRequired");
  failure.value = "";
  if (messageError.value) return;
  if (!altcha.value) {
    failure.value = t("feedback.robot");
    return;
  }
  busy.value = true;
  try {
    const body = feedbackInput.parse({
      kind: kind.value,
      message: message.value,
      email: email.value,
      search,
      altcha: altcha.value,
      website: website.value,
    });
    await $fetch("/api/feedback", { method: "POST", body });
    sent.value = true;
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    failure.value =
      status === 400
        ? t("feedback.robotFailed")
        : status === 429
          ? t("feedback.tooMany")
          : describeError(error);
    // A solution is single use; the field asks for a new one.
    altcha.value = undefined;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <section class="max-w-xl">
    <h1 class="text-3xl font-bold">{{ t("feedback.title") }}</h1>
    <template v-if="sent">
      <p class="mt-4 text-lg" role="status">{{ t("feedback.thanks") }}</p>
      <UButton class="mt-8" to="/" icon="i-lucide-arrow-left" :label="t('feedback.back')" />
    </template>
    <template v-else>
      <p class="mt-4 text-lg">{{ t("feedback.intro") }}</p>
      <form class="mt-8 flex flex-col gap-6" novalidate @submit.prevent="submit">
        <URadioGroup
          v-model="kind"
          :legend="t('feedback.kind')"
          :items="kinds"
          size="lg"
          orientation="vertical"
        />
        <UFormField :label="t('feedback.message')" :error="messageError || undefined" required>
          <UTextarea v-model="message" class="w-full" :rows="5" maxlength="2000" autoresize />
        </UFormField>
        <UFormField
          :label="t('feedback.email')"
          :hint="t('feedback.optional')"
          :description="t('feedback.emailHint')"
        >
          <UInput v-model="email" class="w-full" type="email" autocomplete="email" size="lg" />
        </UFormField>
        <!-- People never see this field; a bot that fills it is thanked and ignored. -->
        <div class="hidden" aria-hidden="true">
          <label
            >Website <input v-model="website" type="text" tabindex="-1" autocomplete="off"
          /></label>
        </div>
        <FeedbackAltchaField v-model="altcha" />
        <p v-if="failure" class="text-error" role="alert">{{ failure }}</p>
        <UButton
          type="submit"
          size="xl"
          class="self-start"
          icon="i-lucide-send"
          :loading="busy"
          :label="t('feedback.send')"
        />
      </form>
    </template>
  </section>
</template>
