import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamp = (name: string) => integer(name, { mode: "timestamp_ms" });

// ---- Better Auth tables ----

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().$defaultFn(() => new Date()),
  updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("createdAt").notNull().$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_userId_idx").on(t.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("accountId").notNull(),
    providerId: text("providerId").notNull(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("accessToken"),
    refreshToken: text("refreshToken"),
    idToken: text("idToken"),
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("createdAt").notNull().$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
  },
  (t) => [index("account_userId_idx").on(t.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt").notNull(),
    createdAt: timestamp("createdAt").notNull().$defaultFn(() => new Date()),
    updatedAt: timestamp("updatedAt").notNull().$defaultFn(() => new Date()),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// ---- App tables ----

export const result = sqliteTable(
  "result",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    modeKey: text("modeKey").notNull(), // e.g. "timed:60", "words:25", "lessons:top"
    wpm: real("wpm").notNull(),
    cpm: real("cpm").notNull(),
    accuracy: real("accuracy").notNull(),
    errors: integer("errors").notNull(),
    seconds: real("seconds").notNull(),
    createdAt: timestamp("createdAt").notNull().$defaultFn(() => new Date()),
  },
  (t) => [
    index("result_user_created_idx").on(t.userId, t.createdAt),
    index("result_mode_wpm_idx").on(t.modeKey, t.wpm),
  ],
);

export type ResultRow = typeof result.$inferSelect;
