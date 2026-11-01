import {
  createError,
  defineEventHandler,
  getRequestHeader,
  getRequestIP,
  readValidatedBody,
} from "nuxt/server";
import { feedbackInput, type FeedbackKind } from "#shared/utils/feedback";

const subjects: Record<FeedbackKind, string> = {
  missingFood: "Lebensmittel fehlt",
  wrongValue: "Wert falsch",
  bug: "Fehler",
  idea: "Idee",
};

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, feedbackInput.parse);
  // A bot filled the field people never see: thanked, nothing sent.
  if (body.website) return { ok: true };
  // Our proxy appends the client as the last entry; earlier ones are whatever the client sent.
  const forwarded = getRequestHeader(event, "x-forwarded-for")?.split(",").at(-1)?.trim();
  const ip = forwarded || getRequestIP(event) || "unknown";
  if (!allowRate(`feedback:${ip}`, 5, 60 * 60 * 1000)) {
    throw createError({ statusCode: 429, statusMessage: "Too many reports, try again later" });
  }
  await enforceAltcha(body.altcha);

  const subject = body.search
    ? `${subjects[body.kind]}: „${body.search}“`
    : `${subjects[body.kind]}: ${body.message.slice(0, 60)}`;
  await sendMail({
    subject: `[Nutrition Kitchen] ${subject}`,
    replyTo: body.email || undefined,
    text: [
      `Art: ${subjects[body.kind]}`,
      `Suche: ${body.search || "-"}`,
      `Antwort an: ${body.email || "keine gewünscht"}`,
      "",
      body.message,
    ].join("\n"),
  });
  return { ok: true };
});
