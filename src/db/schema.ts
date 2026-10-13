import { boolean, doublePrecision, index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const createdAt = () => timestamp("createdAt", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () =>
  timestamp("updatedAt", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());

// ---- Better Auth tables ----

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    ipAddress: text("ipAddress"),
    userAgent: text("userAgent"),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (t) => [index("session_userId_idx").on(t.userId)],
);

export const account = pgTable(
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
    accessTokenExpiresAt: timestamp("accessTokenExpiresAt", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt", { withTimezone: true }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("account_userId_idx").on(t.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

// ---- App tables ----

export const result = pgTable(
  "result",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    userId: text("userId")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    modeKey: text("modeKey").notNull(), // e.g. "timed:60", "words:25", "lessons:top"
    wpm: doublePrecision("wpm").notNull(),
    cpm: doublePrecision("cpm").notNull(),
    accuracy: doublePrecision("accuracy").notNull(),
    errors: integer("errors").notNull(),
    seconds: doublePrecision("seconds").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index("result_user_created_idx").on(t.userId, t.createdAt),
    index("result_mode_wpm_idx").on(t.modeKey, t.wpm),
  ],
);

export type ResultRow = typeof result.$inferSelect;
