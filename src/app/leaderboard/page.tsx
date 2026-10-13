import type { Metadata } from "next";
import Link from "next/link";
import { getLeaderboard, PERIODS, type Period } from "@/db/queries";
import { getSession } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import type { StringKey } from "@/lib/i18n";
import { getTranslator } from "@/lib/i18n-server";
import { DEFAULT_BOARD, LEADERBOARD_BOARDS, labelForKey } from "@/lib/modes";
import type { SearchParams } from "@/lib/redirect";

export const metadata: Metadata = {
  title: "Leaderboard · Lao Typing",
  description: "The fastest Lao typists — public leaderboard for timed, word and sentence tests.",
};

const PERIOD_LABEL: Record<Period, StringKey> = {
  all: "allTime",
  month: "thisMonth",
  week: "thisWeek",
  today: "today",
};

const GROUPS = ["timed", "words", "sentences"] as const;
const MEDALS = ["🥇", "🥈", "🥉"];

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function LeaderboardPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const boardParam = first(params.board);
  const board = (LEADERBOARD_BOARDS as readonly string[]).includes(boardParam ?? "") ? boardParam! : DEFAULT_BOARD;
  const periodParam = first(params.period) as Period | undefined;
  const period: Period = periodParam && PERIODS.includes(periodParam) ? periodParam : "all";

  const [{ lang, t }, session, entries] = await Promise.all([
    getTranslator(),
    getSession(),
    getLeaderboard(board, period),
  ]);
  const me = session?.user.id;

  const href = (b: string, p: Period) => `/leaderboard?board=${b}${p !== "all" ? `&period=${p}` : ""}`;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-lao text-2xl font-bold">🏆 {t("leaderboard")}</h1>
          <p className="font-lao text-sm text-muted">{t("leaderboardSubtitle")}</p>
        </div>
        {!session && (
          <Link
            href="/sign-up?next=/leaderboard"
            className="rounded-lg bg-accent px-4 py-2 font-lao text-sm font-medium text-accent-fg hover:opacity-90"
          >
            {t("joinLeaderboard")} →
          </Link>
        )}
      </div>

      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 sm:p-4">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          {GROUPS.map((group) => (
            <div key={group} className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 font-lao text-sm font-medium text-muted">{t(group)}</span>
              {LEADERBOARD_BOARDS.filter((b) => b.startsWith(group + ":")).map((b) => {
                const value = b.split(":")[1];
                return (
                  <Link
                    key={b}
                    href={href(b, period)}
                    className={`rounded-full border px-3 py-1 font-mono text-sm transition-colors ${
                      b === board
                        ? "border-accent bg-accent/10 text-accent"
                        : "border-line text-muted hover:border-fg/30 hover:text-fg"
                    }`}
                  >
                    {group === "timed" ? `${value}s` : value}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-line pt-3">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={href(board, p)}
              className={`rounded-lg px-3 py-1.5 font-lao text-sm transition-colors ${
                p === period ? "bg-accent text-accent-fg" : "text-muted hover:bg-bg hover:text-fg"
              }`}
            >
              {t(PERIOD_LABEL[p])}
            </Link>
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="border-b border-line px-4 py-3 font-lao text-sm font-semibold">{labelForKey(board, lang)}</div>
        {entries.length === 0 ? (
          <p className="px-4 py-14 text-center font-lao text-muted">{t("noEntries")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="border-b border-line font-lao text-xs text-muted">
                <tr>
                  <th className="w-16 px-4 py-3 text-left font-medium">{t("rank")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("player")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("wpm")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("accuracy")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("date")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {entries.map((e, i) => {
                  const isMe = e.userId === me;
                  return (
                    <tr key={e.userId} className={isMe ? "bg-accent/10" : "hover:bg-bg/60"}>
                      <td className="px-4 py-2.5 font-mono tabular-nums text-muted">
                        {i < 3 ? <span className="text-lg">{MEDALS[i]}</span> : i + 1}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="flex items-center gap-2.5">
                          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-accent/15 font-lao text-xs font-semibold text-accent">
                            {Array.from(e.name.trim())[0]?.toUpperCase() ?? "?"}
                          </span>
                          <span className="truncate font-lao">
                            {e.name}
                            {isMe && <span className="ml-1.5 text-xs text-accent">({t("you")})</span>}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-base font-semibold tabular-nums">
                        {Math.round(e.wpm)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">{Math.round(e.accuracy)}%</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-right font-lao text-muted">
                        {formatDate(e.createdAt, lang, false)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
