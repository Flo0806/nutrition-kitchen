import { createError, getRouterParam, type RequestEvent } from "nuxt/server";
import { z } from "zod";
import { maxRecipes } from "#shared/utils/recipe";

const id = z.coerce.number().int().positive().max(Number.MAX_SAFE_INTEGER);

export function recipeIdOf(event: RequestEvent) {
  const parsed = id.safeParse(getRouterParam(event, "id"));
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: "Invalid recipe id" });
  return parsed.data;
}

export function recipeNotFound() {
  return createError({ statusCode: 404, statusMessage: "Recipe not found" });
}

export function bookFull() {
  return createError({
    statusCode: 409,
    statusMessage: `The recipe book holds ${maxRecipes} recipes at most`,
  });
}
