import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// DATABASE_URL: postgres://user:password@host:5432/dbname (add ?sslmode=require for hosted databases).
// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForDb.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;

export const db = drizzle(pool, { schema });
