import "server-only";
import { query } from "./db";

export interface KeyStat {
  ch: string;
  attempts: number;
  misses: number;
}

// Per-key counts sent with a result: { "ກ": [attempts, misses], ... }. Returns null if malformed.
export function parseKeyStats(input: unknown, keystrokes: number): KeyStat[] | null {
  if (input === undefined) return [];
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const entries = Object.entries(input as Record<string, unknown>);
  if (entries.length > 150) return null;
  const out: KeyStat[] = [];
  for (const [ch, value] of entries) {
    if (Array.from(ch).length !== 1) return null;
    if (!Array.isArray(value) || value.length !== 2) return null;
    const [attempts, misses] = value;
    if (![attempts, misses].every((n) => Number.isInteger(n) && n >= 0)) return null;
    if (misses > attempts || attempts > keystrokes) return null;
    out.push({ ch, attempts, misses });
  }
  return out;
}

export async function addKeyStats(userId: string, stats: KeyStat[]) {
  if (!stats.length) return;
  await query(
    `INSERT INTO key_stat ("userId", ch, attempts, misses)
     SELECT $1, s.ch, s.attempts, s.misses
       FROM unnest($2::text[], $3::int[], $4::int[]) AS s(ch, attempts, misses)
     ON CONFLICT ("userId", ch) DO UPDATE
       SET attempts = key_stat.attempts + EXCLUDED.attempts,
           misses   = key_stat.misses + EXCLUDED.misses`,
    [userId, stats.map((s) => s.ch), stats.map((s) => s.attempts), stats.map((s) => s.misses)],
  );
}

// The keys a member misses most. The miss rate is smoothed ((misses + 1) / (attempts + 10)) so a
// key typed once and missed once doesn't outrank one missed 30 times out of 200.
export async function getWeakKeys(userId: string, limit = 8): Promise<(KeyStat & { rate: number })[]> {
  return query<KeyStat & { rate: number }>(
    `SELECT ch, attempts, misses, misses::float8 / attempts AS rate
       FROM key_stat
      WHERE "userId" = $1 AND ch <> ' ' AND attempts >= 5 AND misses >= 1
      ORDER BY (misses + 1)::float8 / (attempts + 10) DESC, misses DESC
      LIMIT $2`,
    [userId, limit],
  );
}
