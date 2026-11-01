// The handlers of nuxt-auth-utils pass the portable event of nuxt/server.
import { sendRedirect } from "nuxt/server";
import { z } from "zod";

const profile = z.object({ sub: z.string().min(1), name: z.string().min(1).max(200) });

export default defineOAuthGoogleEventHandler({
  // Who someone is and what to call them; no email.
  config: { scope: ["openid", "profile"] },
  async onSuccess(event, { user }) {
    const { sub, name } = profile.parse(user);
    await signIn(event, { provider: "google", providerId: sub, name });
    return sendRedirect(event, "/");
  },
  onError(event) {
    return sendRedirect(event, "/login?failed=google");
  },
});
