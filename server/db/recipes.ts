import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { maxRecipes, type RecipeInput } from "../../shared/utils/recipe";
import type { Db } from "./open";
import { recipeIngredients, recipes } from "./schema";

// Every function takes the owner: a recipe of someone else is not found, never just forbidden. The
// one way around it is a share slug, which its owner hands out on purpose.

type Row = RecipeInput["rows"][number];

export type StoredRecipe = Pick<RecipeInput, "title" | "instructions" | "rows" | "options"> & {
  id: number;
  image: string | null;
  shareSlug: string | null;
  updatedAt: Date;
};

const owned = (userId: number, id: number) => and(eq(recipes.id, id), eq(recipes.userId, userId));

function columns({ title, instructions, options }: RecipeInput) {
  return {
    title,
    instructions,
    pieceWeight: options.pieceWeight,
    bakingLoss: options.bakingLoss,
    options: { voluntary: options.voluntary, referenceIntake: options.referenceIntake },
  };
}

// The database or a transaction of it: both can insert.
function insertRows(db: Pick<Db, "insert">, recipeId: number, rows: Row[]) {
  db.insert(recipeIngredients)
    .values(
      rows.map((row, position) => ({
        recipeId,
        position,
        amount: row.amount,
        ...("custom" in row ? { custom: row.custom } : { foodCode: row.code }),
      })),
    )
    .run();
}

/** The new recipe's id, `"full"` when the user's book already holds `maxRecipes`. */
export function createRecipe(db: Db, userId: number, input: RecipeInput): number | "full" {
  return db.transaction((tx) => {
    const held = tx.select({ n: count() }).from(recipes).where(eq(recipes.userId, userId)).get();
    if ((held?.n ?? 0) >= maxRecipes) return "full";
    const { id } = tx
      .insert(recipes)
      // One clock for created and updated, so the order of the book follows what people did.
      .values({ userId, ...columns(input), createdAt: new Date(), updatedAt: new Date() })
      .returning({ id: recipes.id })
      .get();
    insertRows(tx, id, input.rows);
    return id;
  });
}

/** `false` when the user has no such recipe. */
export function updateRecipe(db: Db, userId: number, id: number, input: RecipeInput): boolean {
  return db.transaction((tx) => {
    const changed = tx
      .update(recipes)
      .set({ ...columns(input), updatedAt: new Date() })
      .where(owned(userId, id))
      .returning({ id: recipes.id })
      .all();
    if (changed.length === 0) return false;
    tx.delete(recipeIngredients).where(eq(recipeIngredients.recipeId, id)).run();
    insertRows(tx, id, input.rows);
    return true;
  });
}

function withRows(db: Db, found: (typeof recipes.$inferSelect)[]): StoredRecipe[] {
  const ids = found.map((recipe) => recipe.id);
  const rows =
    ids.length === 0
      ? []
      : db
          .select()
          .from(recipeIngredients)
          .where(inArray(recipeIngredients.recipeId, ids))
          .orderBy(asc(recipeIngredients.recipeId), asc(recipeIngredients.position))
          .all();
  return found.map((recipe) => ({
    id: recipe.id,
    title: recipe.title,
    instructions: recipe.instructions,
    image: recipe.image,
    shareSlug: recipe.shareSlug,
    updatedAt: recipe.updatedAt,
    options: { ...recipe.options, pieceWeight: recipe.pieceWeight, bakingLoss: recipe.bakingLoss },
    rows: rows
      .filter((row) => row.recipeId === recipe.id)
      .map((row): Row =>
        row.custom
          ? { custom: row.custom, amount: row.amount }
          : { code: row.foodCode ?? "", amount: row.amount },
      ),
  }));
}

export function getRecipe(db: Db, userId: number, id: number): StoredRecipe | undefined {
  return withRows(db, db.select().from(recipes).where(owned(userId, id)).all())[0];
}

export function listRecipes(db: Db, userId: number): StoredRecipe[] {
  const found = db
    .select()
    .from(recipes)
    .where(eq(recipes.userId, userId))
    .orderBy(desc(recipes.updatedAt), desc(recipes.id))
    .all();
  return withRows(db, found);
}

/** The deleted recipe's image, so its file can go too; `false` when there was no such recipe. */
export function deleteRecipe(db: Db, userId: number, id: number): { image: string | null } | false {
  const deleted = db
    .delete(recipes)
    .where(owned(userId, id))
    .returning({ image: recipes.image })
    .all();
  return deleted[0] ?? false;
}

/** Sets the image and returns the one it replaces; `false` when there is no such recipe. */
export function setRecipeImage(
  db: Db,
  userId: number,
  id: number,
  image: string | null,
): { previous: string | null } | false {
  return db.transaction((tx) => {
    const found = tx.select({ image: recipes.image }).from(recipes).where(owned(userId, id)).get();
    if (!found) return false;
    tx.update(recipes).set({ image, updatedAt: new Date() }).where(owned(userId, id)).run();
    return { previous: found.image };
  });
}

/**
 * Makes a recipe public under `slug`, or keeps the slug it already has, so a link handed out stays
 * valid. The slug in use, `false` when there is no such recipe.
 */
export function shareRecipe(db: Db, userId: number, id: number, slug: string): string | false {
  const shared = db
    .update(recipes)
    .set({ shareSlug: sql`coalesce(${recipes.shareSlug}, ${slug})` })
    .where(owned(userId, id))
    .returning({ shareSlug: recipes.shareSlug })
    .get();
  return shared?.shareSlug ?? false;
}

/**
 * Ends the link for good: sharing again gives a new slug. The recipe's image, which has to move to
 * a new name too; `false` when there is no such recipe.
 */
export function unshareRecipe(
  db: Db,
  userId: number,
  id: number,
): { image: string | null } | false {
  const changed = db
    .update(recipes)
    .set({ shareSlug: null })
    .where(owned(userId, id))
    .returning({ image: recipes.image })
    .get();
  return changed ?? false;
}

export function getSharedRecipe(db: Db, slug: string): StoredRecipe | undefined {
  return withRows(db, db.select().from(recipes).where(eq(recipes.shareSlug, slug)).all())[0];
}
