import "server-only";
import { redirect } from "next/navigation";

// Account features need a database, an auth secret, and the site's public URL.
// Without them, the site runs in practice-only mode.
export const accountsEnabled = Boolean(
  process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_URL,
);

// For pages that only make sense with accounts: send visitors to practice instead.
export function requireAccounts() {
  if (!accountsEnabled) redirect("/");
}
