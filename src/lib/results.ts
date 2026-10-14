import "server-only";
import { query, queryOne } from "./db";

export const LEADERBOARD_MIN_ACCURACY = 90;
export const LEADERBOARD_SIZE = 100;

export const PERIODS = ["all", "month", "week", "today"] as const;
export type Period = (typeof PERIODS)[number];

// Start of each leaderboard period, worked out by the database. "Today" starts at
// midnight Laos time, whatever time zone the server runs in.
const PERIOD_START: Record<Period, string> = {
  all: "NULL",
  month: "now() - interval '30 days'",
  week: "now() - interval '7 days'",
  today: "date_trunc('day', now() AT TIME ZONE 'Asia/Vientiane') AT TIME ZONE 'Asia/Vientiane'",
};

export interface ResultRow {
  id: number;
  userId: string;
  modeKey: string;
  wpm: number;
  cpm: number;
  accuracy: number;
  errors: number;
  seconds: number;
  createdAt: Date;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  wpm: number;
  accuracy: number;
  createdAt: Date;
}

export interface NewResult {
  userId: string;
  modeKey: string;
  wpm: number;
  cpm: number;
  accuracy: number;
  errors: number;
  seconds: number;
}

export async function saveResult(r: NewResult): Promise<number> {
  const row = await queryOne<{ id: number }>(
    `INSERT INTO result ("userId", "modeKey", wpm, cpm, accuracy, errors, seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [r.userId, r.modeKey, r.wpm, r.cpm, r.accuracy, r.errors, r.seconds],
  );
  return row!.id;
}

// Best result per typist for one test: DISTINCT ON keeps each user's fastest run
// (ties broken by accuracy, then the earlier run), then those runs are ranked.
export async function getLeaderboard(modeKey: string, period: Period): Promise<LeaderboardEntry[]> {
  return query<LeaderboardEntry>(
    `SELECT b."userId", u.name, b.wpm, b.accuracy, b."createdAt"
       FROM (
         SELECT DISTINCT ON (r."userId") r."userId", r.wpm, r.accuracy, r."createdAt"
           FROM result r
          WHERE r."modeKey" = $1
            AND r.accuracy >= $2
            AND r."createdAt" >= COALESCE(${PERIOD_START[period]}, '-infinity'::timestamptz)
          ORDER BY r."userId", r.wpm DESC, r.accuracy DESC, r."createdAt" ASC
       ) b
       JOIN "user" u ON u.id = b."userId"
      ORDER BY b.wpm DESC, b.accuracy DESC, b."createdAt" ASC
      LIMIT $3`,
    [modeKey, LEADERBOARD_MIN_ACCURACY, LEADERBOARD_SIZE],
  );
}

export async function getUserResults(userId: string, limit = 100): Promise<ResultRow[]> {
  return query<ResultRow>(
    `SELECT id, "userId", "modeKey", wpm, cpm, accuracy, errors, seconds, "createdAt"
       FROM result
      WHERE "userId" = $1
      ORDER BY "createdAt" DESC
      LIMIT $2`,
    [userId, limit],
  );
}

export interface UserSummary {
  tests: number;
  bestWpm: number | null;
  avgAccuracy: number | null;
  totalSeconds: number | null;
}

export async function getUserSummary(userId: string): Promise<UserSummary> {
  // count() is bigint and avg() is numeric, which node-postgres returns as strings — cast them.
  const row = await queryOne<UserSummary>(
    `SELECT count(*)::int                AS tests,
            max(wpm)                     AS "bestWpm",
            avg(accuracy)::float8        AS "avgAccuracy",
            sum(seconds)::float8         AS "totalSeconds"
       FROM result
      WHERE "userId" = $1`,
    [userId],
  );
  return row!;
}
