// The handlers of nuxt-auth-utils pass the portable event of nuxt/server.
import { sendRedirect } from "nuxt/server";
import { AtpAgent } from "@atproto/api";

// The public profile needs no permission; the login itself asks for nothing beyond "atproto".
const publicApi = new AtpAgent({ service: "https://public.api.bsky.app" });

async function displayName(did: string) {
  try {
    const { data } = await publicApi.getProfile({ actor: did });
    return (data.displayName?.trim() || data.handle).slice(0, 200);
  } catch {
    return did;
  }
}

export default defineOAuthBlueskyEventHandler({
  async onSuccess(event, { user }) {
    const did = "did" in user ? user.did : "";
    if (!did) {
      console.error("[auth] Bluesky login failed: the answer names no account (DID)");
      return sendRedirect(event, "/login?failed=bluesky");
    }
    await signIn(event, { provider: "bluesky", providerId: did, name: await displayName(did) });
    return sendRedirect(event, loginReturn(event));
  },
  onError(event, error) {
    // The page only says it failed; the reason belongs in the server log.
    console.error("[auth] Bluesky login failed:", error.message);
    return sendRedirect(event, "/login?failed=bluesky");
  },
});
