import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type Db } from "../../server/db/open";
import { createRecipe, getRecipe, setRecipeImage, shareRecipe } from "../../server/db/recipes";
import { recipeIngredients, recipes, users } from "../../server/db/schema";
import { deleteUser, endSessions, upsertUser } from "../../server/db/users";
import type { RecipeInput } from "../../shared/utils/recipe";

let dir: string;
let db: Db;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "nutrition-kitchen-"));
  db = openDatabase(join(dir, "test.sqlite"));
});

afterEach(() => {
  db.$client.close();
  rmSync(dir, { recursive: true });
});

const rolls: RecipeInput = {
  title: "Brötchen",
  instructions: "",
  rows: [{ code: "C214200", amount: 100 }],
  options: { pieceWeight: null, voluntary: [], referenceIntake: false, bakingLoss: null },
};

const account = (providerId: string) =>
  upsertUser(db, { provider: "google", providerId, name: providerId });

function create(userId: number) {
  const id = createRecipe(db, userId, rolls);
  if (id === "full") throw new Error("book full");
  return id;
}

describe("users", () => {
  it("counts the session version up, for that user only", () => {
    const flo = account("flo");
    const other = account("other");
    expect(flo.sessionVersion).toBe(0);
    endSessions(db, flo.id);
    endSessions(db, flo.id);
    // A new login reads the current version for its cookie.
    expect(account("flo").sessionVersion).toBe(2);
    expect(account("other").sessionVersion).toBe(other.sessionVersion);
  });

  it("deletes a user with every recipe and row, names their pictures, and leaves others alone", () => {
    const flo = account("flo").id;
    const other = account("other").id;
    const withPicture = create(flo);
    setRecipeImage(db, flo, withPicture, "a.webp");
    shareRecipe(db, flo, withPicture, "AAAAAAAAAAAA");
    create(flo);
    const kept = create(other);
    setRecipeImage(db, other, kept, "b.webp");

    expect(deleteUser(db, flo)).toEqual(["a.webp"]);
    expect(
      db
        .select()
        .from(users)
        .all()
        .map((user) => user.id),
    ).toEqual([other]);
    expect(
      db
        .select()
        .from(recipes)
        .all()
        .map((recipe) => recipe.id),
    ).toEqual([kept]);
    expect(
      db
        .select()
        .from(recipeIngredients)
        .all()
        .map((row) => row.recipeId),
    ).toEqual([kept]);
    expect(getRecipe(db, other, kept)?.image).toBe("b.webp");
  });
});
