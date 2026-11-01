import { eq, isNotNull, and, sql } from "drizzle-orm";
import type { Db } from "./open";
import { recipes, users } from "./schema";

export type Account = {
  provider: (typeof users.$inferInsert)["provider"];
  providerId: string;
  name: string;
};

/** The user of a login: created on the first one, the name kept up to date on every later one. */
export function upsertUser(db: Db, { provider, providerId, name }: Account) {
  return db
    .insert(users)
    .values({ provider, providerId, name })
    .onConflictDoUpdate({
      target: [users.provider, users.providerId],
      set: { name: sql`excluded.name` },
    })
    .returning({
      id: users.id,
      name: users.name,
      provider: users.provider,
      sessionVersion: users.sessionVersion,
    })
    .get();
}

/** Ends every session of a user, on every device: their cookies carry the old version. */
export function endSessions(db: Db, userId: number) {
  db.update(users)
    .set({ sessionVersion: sql`${users.sessionVersion} + 1` })
    .where(eq(users.id, userId))
    .run();
}

/**
 * Deletes a user with everything they saved; their recipes and rows go with them in the database.
 * The pictures of those recipes, so their files can go too.
 */
export function deleteUser(db: Db, userId: number): string[] {
  return db.transaction((tx) => {
    const pictures = tx
      .select({ image: recipes.image })
      .from(recipes)
      .where(and(eq(recipes.userId, userId), isNotNull(recipes.image)))
      .all()
      .map((row) => row.image ?? "");
    tx.delete(users).where(eq(users.id, userId)).run();
    return pictures;
  });
}
