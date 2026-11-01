import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openDatabase, type Db } from "../../server/db/open";
import { recipeIngredients, recipes, users } from "../../server/db/schema";
import { upsertUser } from "../../server/db/users";

let dir: string;
let db: Db;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), "nutrition-kitchen-"));
  db = openDatabase(join(dir, "fresh", "test.sqlite"));
});

afterEach(() => {
  db.$client.close();
  rmSync(dir, { recursive: true });
});

const unknownValues = {
  fat: null,
  saturates: null,
  carbohydrate: null,
  sugars: null,
  protein: null,
  salt: null,
  fibre: null,
};

const user = () =>
  db.insert(users).values({ provider: "google", providerId: "1", name: "Flo" }).returning().get();
const recipe = (userId: number, values: Partial<typeof recipes.$inferInsert> = {}) =>
  db
    .insert(recipes)
    .values({
      userId,
      title: "Brötchen",
      options: { voluntary: [], referenceIntake: false },
      ...values,
    })
    .returning()
    .get();

describe("database", () => {
  it("creates its file and folder on first start and is migrated", () => {
    expect(db.select().from(users).all()).toEqual([]);
    expect(db.$client.pragma("journal_mode", { simple: true })).toBe("wal");
    expect(db.$client.pragma("foreign_keys", { simple: true })).toBe(1);
  });

  it("writes and reads a recipe with a food and a raw material of one's own", () => {
    const { id } = recipe(user().id, { pieceWeight: 60, bakingLoss: 180 });
    const custom = {
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
    };
    db.insert(recipeIngredients)
      .values([
        { recipeId: id, position: 0, foodCode: "C214200", amount: 1000 },
        { recipeId: id, position: 1, custom, amount: 30 },
      ])
      .run();

    const read = db.query.recipes.findFirst({ where: eq(recipes.id, id) }).sync();
    expect(read).toMatchObject({ title: "Brötchen", pieceWeight: 60, bakingLoss: 180 });
    const rows = db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, id))
      .all();
    expect(rows).toEqual([
      { recipeId: id, position: 0, foodCode: "C214200", custom: null, amount: 1000 },
      { recipeId: id, position: 1, foodCode: null, custom, amount: 30 },
    ]);
  });

  it("keeps the rules itself, as the last line behind the app", () => {
    const { id: userId } = user();
    const { id } = recipe(userId);
    const row = (values: Partial<typeof recipeIngredients.$inferInsert>) => () =>
      db
        .insert(recipeIngredients)
        .values({ recipeId: id, position: 9, ...values })
        .run();

    expect(row({})).toThrow(/CHECK constraint failed: recipe_ingredients_source/);
    expect(row({ foodCode: "C214200", custom: { name: "x", per100g: unknownValues } })).toThrow(
      /recipe_ingredients_source/,
    );
    expect(row({ foodCode: "C214200", amount: -1 })).toThrow(/recipe_ingredients_amount/);
    expect(row({ recipeId: 999, foodCode: "C214200" })).toThrow(/FOREIGN KEY/);
    expect(() => recipe(userId, { title: "  " })).toThrow(/recipes_title_length/);
    expect(() => recipe(userId, { shareSlug: "short" })).toThrow(/recipes_share_slug/);
    recipe(userId, { shareSlug: "abcdefghij" });
    expect(() => recipe(userId, { shareSlug: "abcdefghij" })).toThrow(/UNIQUE/);
    expect(() => user()).toThrow(/UNIQUE/);
  });

  it("deletes a user's recipes and their rows with the user", () => {
    const { id: userId } = user();
    const { id } = recipe(userId);
    db.insert(recipeIngredients)
      .values({ recipeId: id, position: 0, foodCode: "C214200", amount: 1 })
      .run();
    db.delete(users).where(eq(users.id, userId)).run();
    expect(db.select().from(recipes).all()).toEqual([]);
    expect(db.select().from(recipeIngredients).all()).toEqual([]);
  });

  it("opens an existing database without migrating it twice", () => {
    recipe(user().id);
    const path = db.$client.name;
    db.$client.close();
    db = openDatabase(path);
    expect(db.select().from(recipes).all()).toHaveLength(1);
  });
});

describe("upsertUser", () => {
  it("creates a user on the first login and finds the same one on the next", () => {
    const first = upsertUser(db, { provider: "bluesky", providerId: "did:plc:abc", name: "Flo" });
    const again = upsertUser(db, {
      provider: "bluesky",
      providerId: "did:plc:abc",
      name: "Florian",
    });
    expect(again).toEqual({
      id: first.id,
      name: "Florian",
      provider: "bluesky",
      sessionVersion: 0,
    });
    expect(db.select().from(users).all()).toHaveLength(1);
  });

  it("keeps the same id at another provider apart", () => {
    const google = upsertUser(db, { provider: "google", providerId: "42", name: "A" });
    const bluesky = upsertUser(db, { provider: "bluesky", providerId: "42", name: "B" });
    expect(google.id).not.toBe(bluesky.id);
  });
});
