// Only in the e2e build (see $env.e2e in nuxt.config.ts): signs in without Google or Bluesky.
// server/test is no folder Nitro scans, so no other build has this route.
import { defineEventHandler, readValidatedBody } from "nuxt/server";
import { z } from "zod";

const account = z.object({
  provider: z.enum(["google", "bluesky"]),
  providerId: z.string().min(1),
  name: z.string().min(1),
});

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, account.parse);
  return signIn(event, body);
});
