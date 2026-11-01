import { z } from "zod";

const schema = z.object({
  databasePath: z.string().trim().min(1),
  // Seals the session cookie. Nuxt only checks it at the first login; this stops the start instead.
  appSecret: z.string().min(32, "NUXT_APP_SECRET needs at least 32 characters"),
});

let config: z.infer<typeof schema> | undefined;

/** The server's runtime config, checked once; a wrong value stops the server at start. */
export function serverConfig() {
  if (!config) {
    const result = schema.safeParse(useRuntimeConfig());
    if (!result.success)
      throw new Error(`Invalid configuration:\n${z.prettifyError(result.error)}`);
    config = result.data;
  }
  return config;
}
