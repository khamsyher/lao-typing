import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read Next.js env files on its own.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — fall back to the defaults below
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
});
