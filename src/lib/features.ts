import "server-only";
import { redirect } from "next/navigation";

// Accounts (sign-in, saved history, leaderboard) need a database and an auth secret.
// Without both — e.g. a first Vercel deploy with no environment variables — the site runs
// in practice-only mode: typing practice works fully and the account features are hidden.
// Add DATABASE_URL and BETTER_AUTH_SECRET (and redeploy) to switch accounts on.
export const accountsEnabled = Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET);

// For pages that only make sense with accounts: send visitors to practice instead.
export function requireAccounts() {
  if (!accountsEnabled) redirect("/");
}
