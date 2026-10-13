import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read Next.js env files on its own.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — use the environment as is
}

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set (see .env.example)");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL },
});
