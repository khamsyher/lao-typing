import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { db } from "@/db";
import * as schema from "@/db/schema";

const googleId = process.env.GOOGLE_CLIENT_ID;
const googleSecret = process.env.GOOGLE_CLIENT_SECRET;

// Google sign-in is offered only when its credentials are configured.
export const googleEnabled = !!(googleId && googleSecret);

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  socialProviders: googleEnabled ? { google: { clientId: googleId!, clientSecret: googleSecret! } } : {},
  plugins: [nextCookies()],
});

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}
