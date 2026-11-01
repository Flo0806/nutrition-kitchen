import { defineEventHandler } from "nuxt/server";
import { listRecipes } from "../../db/recipes";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  return listRecipes(useDb(), user.id).map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    shareSlug: recipe.shareSlug,
    updatedAt: recipe.updatedAt.toISOString(),
    energy: recipeEnergy(recipe),
  }));
});
