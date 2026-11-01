import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import nodemailer, { type Transporter } from "nodemailer";
import { createError } from "nuxt/server";

type Mail = { subject: string; text: string; replyTo?: string };

let transporter: Transporter | undefined;

/**
 * Sends a mail to the address in NUXT_MAIL_TO. It lives in the server's environment only, never in
 * the page or the code. The e2e build writes to NUXT_MAIL_OUTBOX instead.
 */
export async function sendMail(mail: Mail) {
  const { host, port, user, password, from, to, outbox } = useRuntimeConfig().mail;
  if (outbox) {
    await mkdir(dirname(outbox), { recursive: true });
    await appendFile(outbox, `${JSON.stringify({ to, ...mail })}\n`);
    return;
  }
  if (!host || !user || !password || !to) {
    throw createError({ statusCode: 503, statusMessage: "Feedback is not set up" });
  }
  transporter ??= nodemailer.createTransport({
    host,
    port: Number(port),
    secure: Number(port) === 465,
    auth: { user, pass: password },
  });
  await transporter.sendMail({ from: from || `Nutrition Kitchen <${user}>`, to, ...mail });
}
