/** What a supplier sheet gives, in the order of the label; energy is always calculated. */
export const materialNutrients = [
  "fat",
  "saturates",
  "carbohydrate",
  "sugars",
  "protein",
  "salt",
  "fibre",
] as const;
export type MaterialNutrient = (typeof materialNutrients)[number];

/** A raw material from a supplier sheet: grams per 100 g as exact decimal text, `null` unknown. */
export type CustomMaterial = { name: string; per100g: Record<MaterialNutrient, string | null> };

/** A recipe row is a food of the database or a raw material of the user's own. */
export type Source = { code: string } | { custom: CustomMaterial };
