import { and, desc, eq, gte, sql } from "drizzle-orm";
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

// Best result per typist for one board. SQLite returns the other columns from the row
// that holds the MAX(), so accuracy and date belong to the best run.
export async function getLeaderboard(modeKey: string, period: Period): Promise<LeaderboardEntry[]> {
  const since = periodStart(period);
  const best = sql<number>`max(${result.wpm})`;
  const rows = await db
    .select({
      userId: result.userId,
      name: user.name,
      wpm: best,
      accuracy: result.accuracy,
      createdAt: result.createdAt,
    })
    .from(result)
    .innerJoin(user, eq(user.id, result.userId))
    .where(
      and(
        eq(result.modeKey, modeKey),
        gte(result.accuracy, LEADERBOARD_MIN_ACCURACY),
        since ? gte(result.createdAt, since) : undefined,
      ),
    )
    .groupBy(result.userId)
    .orderBy(desc(best))
    .limit(LEADERBOARD_SIZE);
  return rows;
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
      tests: sql<number>`count(*)`,
      bestWpm: sql<number | null>`max(${result.wpm})`,
      avgAccuracy: sql<number | null>`avg(${result.accuracy})`,
      totalSeconds: sql<number | null>`sum(${result.seconds})`,
    })
    .from(result)
    .where(eq(result.userId, userId));
  return row;
}
