import type { RecipeInput } from "./recipe";

/** 72 random bits: a shared recipe is found through its link only. */
export const shareSlug = /^[A-Za-z0-9_-]{12}$/;

export const sharedPath = (slug: string) => `/r/${slug}`;

/** Holds where a login started, across the round trip to the provider. */
export const loginReturnCookie = "login-return";

/**
 * Where a login may return to: a shared recipe and nothing else, so a planted cookie cannot send
 * anyone to another site.
 */
export function loginReturnPath(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const slug = /^\/r\/([^/?#]*)$/.exec(value)?.[1];
  return slug !== undefined && shareSlug.test(slug) ? value : undefined;
}

/** What a shared recipe shows to anyone with the link: the recipe, nothing about its owner. */
export type SharedRecipe = Pick<RecipeInput, "title" | "instructions" | "rows" | "options"> & {
  image: string | null;
};
