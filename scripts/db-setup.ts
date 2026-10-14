// Creates the database schema. Safe to re-run: it only adds what is missing.
// Usage: npm run db:setup                   -> schema
//        npm run db:setup -- --demo         -> also demo typists and results for the leaderboard
//        npm run db:setup -- --clear-demo   -> remove the demo data again
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";
import { clearDemo, seedDemo } from "./demo-data";

process.loadEnvFile?.(join(process.cwd(), ".env.local"));

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  if (!/^postgres(ql)?:\/\//.test(url)) {
    throw new Error("DATABASE_URL must look like postgresql://postgres:<password>@localhost:5432/lao_typing_app");
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    const schema = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
    await client.query(schema);
    const { rows } = await client.query<{ name: string }>(
      `SELECT table_name AS name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name IN ('user', 'session', 'account', 'verification', 'result')
        ORDER BY 1`,
    );
    console.log(`✓ Schema applied to ${client.database} (${rows.map((r) => r.name).join(", ")})`);

    if (process.argv.includes("--clear-demo")) await clearDemo(client);
    else if (process.argv.includes("--demo")) await seedDemo(client);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("✗", err.message);
  process.exit(1);
});
