import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { pool } from "./db";
import { accountsEnabled } from "./features";

const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

// Google sign-in is offered only when its credentials are configured.
export const googleEnabled = !!(googleId && googleSecret);

// On Vercel, fall back to the addresses Vercel provides when BETTER_AUTH_URL is not set:
// the production domain for production deployments, the deployment's own URL for previews.
const https = (host?: string) => (host ? `https://${host}` : undefined);
const vercelURL = https(
  process.env.VERCEL_ENV === "production" ? process.env.VERCEL_PROJECT_PRODUCTION_URL : process.env.VERCEL_URL,
);

// Created on first use, and only when accounts are enabled: Better Auth checks its secret as
// soon as it is set up, so in practice-only mode it is never set up at all.
function createAuth() {
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL || vercelURL,
    // Sign-in requests are accepted from any of this deployment's Vercel addresses.
    trustedOrigins: [
      https(process.env.VERCEL_URL),
      https(process.env.VERCEL_BRANCH_URL),
      https(process.env.VERCEL_PROJECT_PRODUCTION_URL),
    ].filter((origin): origin is string => !!origin),
    database: pool, // tables are created by db/schema.sql (npm run db:setup)
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
    socialProviders: googleEnabled
      ? {
          google: {
            clientId: googleId!,
            clientSecret: googleSecret!,
            prompt: "select_account", // let people pick which Google account to use
          },
        }
      : {},
    // Google is not linked to an existing email/password account with the same address unless that
    // email was verified (Better Auth's default) — otherwise someone could pre-register a victim's
    // email and gain access when the victim later signs in with Google.
    plugins: [nextCookies()],
  });
}

let authInstance: ReturnType<typeof createAuth> | undefined;
export function getAuth() {
  return (authInstance ??= createAuth());
}

// The session is read in the root layout, so a failure here would break every page. If it
// can't be read (missing BETTER_AUTH_SECRET, database down or misconfigured), log why and
// treat the visitor as signed out: practice and public pages keep working.
export async function getSession() {
  if (!accountsEnabled) return null; // practice-only mode: nobody is signed in
  const requestHeaders = await headers(); // outside try: Next.js must see this request-time access
  try {
    return await getAuth().api.getSession({ headers: requestHeaders });
  } catch (err) {
    console.error(
      "[auth] Could not read the session — check BETTER_AUTH_SECRET and DATABASE_URL (on Vercel: Settings → Environment Variables, then redeploy).",
      err,
    );
    return null;
  }
}
