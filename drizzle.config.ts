import { defineConfig } from "drizzle-kit";

// drizzle-kit does not read Next.js env files on its own.
try {
  process.loadEnvFile(".env.local");
} catch {
  // no .env.local — use the environment as is
}

// Fail fast: with a non-Postgres URL the pg driver silently tries localhost without a password and hangs.
const url = process.env.DATABASE_URL ?? "";
if (!/^postgres(ql)?:\/\//.test(url)) {
  throw new Error(
    "DATABASE_URL must be a PostgreSQL URL like postgres://user:password@localhost:5432/lao_typing (see .env.example)",
  );
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
});
