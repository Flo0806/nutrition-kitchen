import { sql } from "drizzle-orm";
import type { Db } from "./open";
import { users } from "./schema";

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
    .returning({ id: users.id, name: users.name, provider: users.provider })
    .get();
}
