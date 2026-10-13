import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from ".";
import { result, user } from "./schema";

export const LEADERBOARD_MIN_ACCURACY = 90;
export const LEADERBOARD_SIZE = 100;

export const PERIODS = ["all", "month", "week", "today"] as const;
export type Period = (typeof PERIODS)[number];

export function periodStart(period: Period, now = new Date()): Date | null {
  const d = new Date(now);
  switch (period) {
    case "all":
      return null;
    case "today":
      d.setHours(0, 0, 0, 0);
      return d;
    case "week":
      d.setDate(d.getDate() - 7);
      return d;
    case "month":
      d.setDate(d.getDate() - 30);
      return d;
  }
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  wpm: number;
  accuracy: number;
  createdAt: Date;
}

// Best result per typist for one board: DISTINCT ON keeps each user's fastest run
// (ties broken by accuracy, then the earlier run), then those runs are ranked.
export async function getLeaderboard(modeKey: string, period: Period): Promise<LeaderboardEntry[]> {
  const since = periodStart(period);
  const bestRuns = db
    .selectDistinctOn([result.userId], {
      userId: result.userId,
      wpm: result.wpm,
      accuracy: result.accuracy,
      createdAt: result.createdAt,
    })
    .from(result)
    .where(
      and(
        eq(result.modeKey, modeKey),
        gte(result.accuracy, LEADERBOARD_MIN_ACCURACY),
        since ? gte(result.createdAt, since) : undefined,
      ),
    )
    .orderBy(result.userId, desc(result.wpm), desc(result.accuracy), asc(result.createdAt))
    .as("best_runs");

  return db
    .select({
      userId: bestRuns.userId,
      name: user.name,
      wpm: bestRuns.wpm,
      accuracy: bestRuns.accuracy,
      createdAt: bestRuns.createdAt,
    })
    .from(bestRuns)
    .innerJoin(user, eq(user.id, bestRuns.userId))
    .orderBy(desc(bestRuns.wpm), desc(bestRuns.accuracy), asc(bestRuns.createdAt))
    .limit(LEADERBOARD_SIZE);
}

export async function getUserResults(userId: string, limit = 100) {
  return db
    .select()
    .from(result)
    .where(eq(result.userId, userId))
    .orderBy(desc(result.createdAt))
    .limit(limit);
}

export async function getUserSummary(userId: string) {
  const [row] = await db
    .select({
      // Postgres returns count() as bigint and avg() as numeric (strings in node-postgres); cast them.
      tests: sql<number>`count(*)::int`,
      bestWpm: sql<number | null>`max(${result.wpm})`,
      avgAccuracy: sql<number | null>`avg(${result.accuracy})::float8`,
      totalSeconds: sql<number | null>`sum(${result.seconds})::float8`,
    })
    .from(result)
    .where(eq(result.userId, userId));
  return row;
}
