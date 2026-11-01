import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
// Relative and type only: drizzle-kit reads this file without Nuxt's aliases.
import type { CustomMaterial } from "../../shared/utils/source";
import type { Voluntary } from "@thereforejs/nutrition";

const createdAt = () =>
  integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const users = sqliteTable(
  "users",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    provider: text({ enum: ["google", "bluesky"] }).notNull(),
    providerId: text("provider_id").notNull(),
    name: text().notNull(),
    avatarUrl: text("avatar_url"),
    // In the sealed cookie too; a logout counts it up, so every older cookie stops working.
    sessionVersion: integer("session_version").notNull().default(0),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex("users_provider_account").on(table.provider, table.providerId),
    check("users_provider_known", sql`${table.provider} in ('google', 'bluesky')`),
  ],
);

// Inputs only, never results: the declaration is calculated on every view, so a patch of foods
// reaches saved recipes.
export const recipes = sqliteTable(
  "recipes",
  {
    id: integer().primaryKey({ autoIncrement: true }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text().notNull(),
    instructions: text().notNull().default(""),
    pieceWeight: real("piece_weight"),
    bakingLoss: real("baking_loss"),
    options: text({ mode: "json" })
      .$type<{ voluntary: Voluntary[]; referenceIntake: boolean }>()
      .notNull(),
    image: text(),
    shareSlug: text("share_slug").unique(),
    createdAt: createdAt(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  },
  (table) => [
    index("recipes_user").on(table.userId),
    check("recipes_title_length", sql`length(trim(${table.title})) between 1 and 120`),
    check("recipes_piece_weight", sql`${table.pieceWeight} is null or ${table.pieceWeight} >= 0`),
    check("recipes_baking_loss", sql`${table.bakingLoss} is null or ${table.bakingLoss} >= 0`),
    check(
      "recipes_share_slug",
      sql`${table.shareSlug} is null or length(${table.shareSlug}) >= 10`,
    ),
  ],
);

export const recipeIngredients = sqliteTable(
  "recipe_ingredients",
  {
    recipeId: integer("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    position: integer().notNull(),
    foodCode: text("food_code"),
    custom: text({ mode: "json" }).$type<CustomMaterial>(),
    amount: real(),
  },
  (table) => [
    primaryKey({ columns: [table.recipeId, table.position] }),
    // A row is a food of the database or a raw material of one's own, never both, never neither.
    check(
      "recipe_ingredients_source",
      sql`(${table.foodCode} is null) <> (${table.custom} is null)`,
    ),
    check("recipe_ingredients_amount", sql`${table.amount} is null or ${table.amount} >= 0`),
  ],
);
