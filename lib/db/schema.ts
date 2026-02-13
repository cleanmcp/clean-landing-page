import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const user = pgTable("Users", {
  // Clerk user IDs are strings (e.g. "user_2abc..."), not UUIDs
  id: text("id").primaryKey(),
  org: uuid("org"),
  name: text("name"),
  email: text("email"),
});

