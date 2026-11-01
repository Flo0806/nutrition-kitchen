import { randomBytes } from "node:crypto";
import { createChallenge, randomInt } from "altcha-lib";
import { deriveKey } from "altcha-lib/algorithms/pbkdf2";
import { CappedMap } from "altcha-lib/frameworks/h3";
import { verify } from "altcha-lib/frameworks/shared";
import { createError } from "nuxt/server";

// Per process: the one container issues and checks every challenge; a restart only invalidates
// the forms open at that moment.
const signatureSecret = randomBytes(32).toString("hex");
const keySecret = randomBytes(32).toString("hex");
const usedPayloads = new CappedMap<string, boolean>({ maxSize: 10_000 });

export function createAltchaChallenge() {
  return createChallenge({
    algorithm: "PBKDF2/SHA-256",
    cost: 5_000,
    counter: randomInt(5_000, 10_000),
    deriveKey,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    hmacSignatureSecret: signatureSecret,
    hmacKeySignatureSecret: keySecret,
  });
}

/** 400 unless the payload solves a challenge of ours that was not used before. */
export async function enforceAltcha(payload: string) {
  const { verification } = await verify(
    payload,
    deriveKey,
    signatureSecret,
    keySecret,
    usedPayloads,
  );
  if (!verification?.verified) {
    throw createError({ statusCode: 400, statusMessage: "Spam protection failed" });
  }
}
