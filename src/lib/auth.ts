import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { pool } from "./db";

const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

// Google sign-in is offered only when its credentials are configured.
export const googleEnabled = !!(googleId && googleSecret);

export const auth = betterAuth({
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

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
