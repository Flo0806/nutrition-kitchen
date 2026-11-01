/** Signing out and deleting the account: the server ends the session, the page follows. */
export function useAccount() {
  const { fetch: refreshSession } = useUserSession();
  const { saved } = useRecipe();

  async function logout() {
    await $fetch("/api/logout", { method: "POST" });
    await refreshSession();
  }

  async function deleteAccount() {
    await $fetch("/api/me", { method: "DELETE" });
    // The builder keeps its rows, but the recipe they came from is gone.
    saved.value = null;
    await refreshSession();
  }

  return { logout, deleteAccount };
}
