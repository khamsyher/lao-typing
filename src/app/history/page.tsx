import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserResults, getUserSummary } from "@/db/queries";
import { getSession } from "@/lib/auth";
import { formatDate, formatDuration } from "@/lib/format";
import { getTranslator } from "@/lib/i18n-server";
import { labelForKey } from "@/lib/modes";

export const metadata: Metadata = { title: "My history · Lao Typing" };

export default async function HistoryPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/history");

  const { lang, t } = await getTranslator();
  const [results, summary] = await Promise.all([
    getUserResults(session.user.id),
    getUserSummary(session.user.id),
  ]);
  const last10 = results.slice(0, 10);
  const avgLast10 = last10.length ? last10.reduce((n, r) => n + r.wpm, 0) / last10.length : 0;

  const tiles = [
    { label: t("tests"), value: summary.tests },
    { label: t("bestWpm"), value: Math.round(summary.bestWpm ?? 0), accent: true },
    { label: t("avgWpm"), value: Math.round(avgLast10) },
    { label: t("avgAccuracy"), value: `${Math.round(summary.avgAccuracy ?? 0)}%` },
    { label: t("totalTime"), value: formatDuration(summary.totalSeconds ?? 0) },
  ];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="font-lao text-2xl font-bold">{t("myHistory")}</h1>
        <p className="font-lao text-sm text-muted">{session.user.name}</p>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-line bg-surface px-4 py-3">
            <div className="font-lao text-xs text-muted">{tile.label}</div>
            <div className={`font-mono text-2xl font-semibold tabular-nums ${tile.accent ? "text-accent" : ""}`}>
              {tile.value}
            </div>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-surface">
        {results.length === 0 ? (
          <div className="flex flex-col items-center gap-4 px-4 py-14 text-center">
            <p className="font-lao text-muted">{t("historyEmpty")}</p>
            <Link
              href="/"
              className="rounded-lg bg-accent px-5 py-2 font-lao text-sm font-medium text-accent-fg hover:opacity-90"
            >
              {t("startPracticing")} →
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-line font-lao text-xs text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">{t("date")}</th>
                  <th className="px-4 py-3 text-left font-medium">{t("mode")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("wpm")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("cpm")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("accuracy")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("errors")}</th>
                  <th className="px-4 py-3 text-right font-medium">{t("time")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {results.map((r) => (
                  <tr key={r.id} className="hover:bg-bg/60">
                    <td className="whitespace-nowrap px-4 py-2.5 font-lao text-muted">{formatDate(r.createdAt, lang)}</td>
                    <td className="px-4 py-2.5 font-lao">{labelForKey(r.modeKey, lang)}</td>
                    <td className="px-4 py-2.5 text-right font-mono font-semibold tabular-nums">{Math.round(r.wpm)}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted">{Math.round(r.cpm)}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums">{Math.round(r.accuracy)}%</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted">{r.errors}</td>
                    <td className="px-4 py-2.5 text-right font-mono tabular-nums text-muted">{r.seconds.toFixed(1)}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
