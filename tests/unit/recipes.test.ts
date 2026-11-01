import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import fc from "fast-check";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { openDatabase, type Db } from "../../server/db/open";
import {
  createRecipe,
  deleteRecipe,
  getRecipe,
  getSharedRecipe,
  listRecipes,
  setRecipeImage,
  shareRecipe,
  unshareRecipe,
  updateRecipe,
} from "../../server/db/recipes";
import { recipeIngredients } from "../../server/db/schema";
import { upsertUser } from "../../server/db/users";
import { recipeInput, type RecipeInput } from "../../shared/utils/recipe";

let dir: string;
let db: Db;
let flo: number;
let other: number;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "nutrition-kitchen-"));
  db = openDatabase(join(dir, "test.sqlite"));
  flo = upsertUser(db, { provider: "google", providerId: "1", name: "Flo" }).id;
  other = upsertUser(db, { provider: "google", providerId: "2", name: "Other" }).id;
});

afterEach(() => {
  db.$client.close();
  rmSync(dir, { recursive: true });
});

const rolls: RecipeInput = {
  title: "Brötchen",
  instructions: "Kneten, gehen lassen, backen.",
  rows: [
    { code: "C214200", amount: 1000 },
    { code: "N110000", amount: 600 },
    {
      custom: {
        name: "Backmittel",
        per100g: {
          fat: "0.4",
          saturates: null,
          carbohydrate: "12.5",
          sugars: null,
          protein: "40.2",
          salt: "1.25",
          fibre: null,
        },
      },
      amount: 30,
    },
    { code: "R111000", amount: null },
  ],
  options: { pieceWeight: 60, voluntary: ["fibre"], referenceIntake: true, bakingLoss: 180 },
};

describe("recipes", () => {
  it("reads back what was saved, rows in order", () => {
    const id = createRecipe(db, flo, rolls);
    expect(getRecipe(db, flo, id)).toMatchObject({ id, image: null, ...rolls });
  });

  it("round-trips every valid recipe", () => {
    const grams = fc.option(
      fc.integer({ min: 0, max: 100_000 }).map((c) => c / 100),
      { nil: null },
    );
    const input = fc.record({
      title: fc.string({ minLength: 1, maxLength: 120 }).filter((t) => t.trim() === t && t !== ""),
      instructions: fc.string({ maxLength: 300 }).map((t) => t.trim()),
      rows: fc.array(
        fc.record({ code: fc.constantFrom("C214200", "N110000", "R111000"), amount: grams }),
        { minLength: 1, maxLength: 20 },
      ),
      options: fc.record({
        pieceWeight: grams,
        voluntary: fc.uniqueArray(fc.constantFrom("starch" as const, "fibre" as const)),
        referenceIntake: fc.boolean(),
        bakingLoss: grams,
      }),
    });
    fc.assert(
      fc.property(input, (value) => {
        const parsed = recipeInput.parse(value);
        const id = createRecipe(db, flo, parsed);
        expect(getRecipe(db, flo, id)).toMatchObject(parsed);
      }),
      { numRuns: 50 },
    );
  });

  it("keeps each user's recipes to themselves", () => {
    const id = createRecipe(db, flo, rolls);
    expect(getRecipe(db, other, id)).toBeUndefined();
    expect(listRecipes(db, other)).toEqual([]);
    expect(updateRecipe(db, other, id, { ...rolls, title: "Taken" })).toBe(false);
    expect(deleteRecipe(db, other, id)).toBe(false);
    expect(setRecipeImage(db, other, id, "x.webp")).toBe(false);
    expect(getRecipe(db, flo, id)).toMatchObject({ title: "Brötchen", image: null });
  });

  it("replaces the rows on an update", () => {
    const id = createRecipe(db, flo, rolls);
    const fewer = { ...rolls, title: "Fladen", rows: [{ code: "C214200", amount: 500 }] };
    expect(updateRecipe(db, flo, id, fewer)).toBe(true);
    expect(getRecipe(db, flo, id)).toMatchObject(fewer);
  });

  it("lists the last changed first", () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      vi.setSystemTime(new Date("2026-11-01T10:00:00Z"));
      const first = createRecipe(db, flo, rolls);
      vi.setSystemTime(new Date("2026-11-01T10:01:00Z"));
      const second = createRecipe(db, flo, { ...rolls, title: "Zweites" });
      expect(listRecipes(db, flo).map((recipe) => recipe.id)).toEqual([second, first]);
      vi.setSystemTime(new Date("2026-11-01T10:02:00Z"));
      updateRecipe(db, flo, first, { ...rolls, title: "Wieder vorn" });
      expect(listRecipes(db, flo)[0]?.id).toBe(first);
    } finally {
      vi.useRealTimers();
    }
  });

  it("deletes a recipe with its rows and tells which image to remove", () => {
    const id = createRecipe(db, flo, rolls);
    setRecipeImage(db, flo, id, "abc.webp");
    expect(deleteRecipe(db, flo, id)).toEqual({ image: "abc.webp" });
    expect(db.select().from(recipeIngredients).all()).toEqual([]);
  });

  it("tells which image a new one replaces", () => {
    const id = createRecipe(db, flo, rolls);
    expect(setRecipeImage(db, flo, id, "one.webp")).toEqual({ previous: null });
    expect(setRecipeImage(db, flo, id, "two.webp")).toEqual({ previous: "one.webp" });
    expect(getRecipe(db, flo, id)?.image).toBe("two.webp");
  });

  it("shares a recipe under one slug until it is private again", () => {
    const id = createRecipe(db, flo, rolls);
    expect(getRecipe(db, flo, id)?.shareSlug).toBeNull();
    expect(shareRecipe(db, flo, id, "AAAAAAAAAAAA")).toBe("AAAAAAAAAAAA");
    // Sharing again keeps the link people already have.
    expect(shareRecipe(db, flo, id, "BBBBBBBBBBBB")).toBe("AAAAAAAAAAAA");
    expect(getSharedRecipe(db, "AAAAAAAAAAAA")).toMatchObject({ id, ...rolls });

    expect(unshareRecipe(db, flo, id)).toEqual({ image: null });
    expect(getSharedRecipe(db, "AAAAAAAAAAAA")).toBeUndefined();
    // A new share is a new link: the old one stays dead.
    expect(shareRecipe(db, flo, id, "CCCCCCCCCCCC")).toBe("CCCCCCCCCCCC");
    expect(getSharedRecipe(db, "AAAAAAAAAAAA")).toBeUndefined();
  });

  it("lets only the owner share or end a share", () => {
    const id = createRecipe(db, flo, rolls);
    expect(shareRecipe(db, other, id, "AAAAAAAAAAAA")).toBe(false);
    expect(getSharedRecipe(db, "AAAAAAAAAAAA")).toBeUndefined();
    shareRecipe(db, flo, id, "AAAAAAAAAAAA");
    expect(unshareRecipe(db, other, id)).toBe(false);
    expect(getSharedRecipe(db, "AAAAAAAAAAAA")).toBeDefined();
  });

  it("keeps a recipe and its link when the content changes", () => {
    const id = createRecipe(db, flo, rolls);
    shareRecipe(db, flo, id, "AAAAAAAAAAAA");
    updateRecipe(db, flo, id, { ...rolls, title: "Neu" });
    expect(getSharedRecipe(db, "AAAAAAAAAAAA")?.title).toBe("Neu");
  });
});
