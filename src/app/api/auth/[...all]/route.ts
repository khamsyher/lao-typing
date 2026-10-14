import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "@/lib/auth";
import { accountsEnabled } from "@/lib/features";

// In practice-only mode the auth endpoints don't exist.
const disabled = () => Response.json({ error: "accounts are not enabled" }, { status: 404 });
const handlers = accountsEnabled ? toNextJsHandler(getAuth()) : { GET: disabled, POST: disabled };

export const { GET, POST } = handlers;
