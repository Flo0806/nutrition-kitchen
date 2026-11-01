import { inputRow, type RecipeInput } from "#shared/utils/recipe";
import type { SavedRecipe } from "~/utils/draft";

export type BookEntry = {
  id: number;
  title: string;
  image: string | null;
  shareSlug: string | null;
  updatedAt: string;
  energy: Record<string, string> | null;
};

type StoredRecipe = Pick<RecipeInput, "title" | "instructions" | "rows" | "options"> & {
  id: number;
  image: string | null;
};

/** The signed-in user's saved recipes, through the recipes api. */
export function useRecipeBook() {
  const { rows, options, saved, open } = useRecipe();

  /** Saves what the builder holds: a new recipe, or the one it was opened from. */
  async function save(meta: Pick<SavedRecipe, "title" | "instructions">) {
    const body: RecipeInput = {
      ...meta,
      rows: rows.value.map(inputRow),
      options: options.value,
    };
    const id = saved.value
      ? (await $fetch<{ id: number }>(`/api/recipes/${saved.value.id}`, { method: "PUT", body })).id
      : (await $fetch<{ id: number }>("/api/recipes", { method: "POST", body })).id;
    saved.value = { id, ...meta, image: saved.value?.image ?? null };
    return id;
  }

  async function setPicture(id: number, file: File | null) {
    if (file) {
      const form = new FormData();
      form.append("picture", file);
      const { image } = await $fetch<{ image: string }>(`/api/recipes/${id}/image`, {
        method: "PUT",
        body: form,
      });
      if (saved.value?.id === id) saved.value = { ...saved.value, image };
    } else {
      await $fetch(`/api/recipes/${id}/image`, { method: "DELETE" });
      if (saved.value?.id === id) saved.value = { ...saved.value, image: null };
    }
  }

  async function openSaved(id: number) {
    const recipe = await $fetch<StoredRecipe>(`/api/recipes/${id}`);
    open(recipe, {
      id: recipe.id,
      title: recipe.title,
      instructions: recipe.instructions,
      image: recipe.image,
    });
  }

  async function remove(id: number) {
    await $fetch(`/api/recipes/${id}`, { method: "DELETE" });
    // The builder keeps the rows, but they belong to no saved recipe any more.
    if (saved.value?.id === id) saved.value = null;
  }

  return { save, setPicture, openSaved, remove };
}

/** A sentence for a failed request, in the words of the interface. */
export function useRequestError() {
  const { t } = useI18n();
  return (error: unknown) => {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 401) return t("errors.signedOut");
    if (status === 413) return t("errors.pictureTooLarge");
    if (status === 415) return t("errors.pictureFormat");
    if (status === 429) return t("errors.tooMany");
    return t("errors.general");
  };
}
