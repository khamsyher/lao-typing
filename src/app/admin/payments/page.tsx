import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import AdminPaymentActions from "@/components/AdminPaymentActions";
import { requireAccounts } from "@/lib/features";
import { formatDate } from "@/lib/format";
import { getTranslator } from "@/lib/i18n-server";
import { getViewer, isActive, listPaymentsForAdmin, type AdminPaymentRow } from "@/lib/premium";
import { STATUS_LABEL, STATUS_STYLE, formatLak } from "@/lib/premium-ui";

export const metadata: Metadata = { title: "Premium payments · Admin · Lao Typing", robots: { index: false } };

export default function AdminPaymentsPage() {
  requireAccounts();
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6" />}>
      <AdminPayments />
    </Suspense>
  );
}

async function AdminPayments() {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) notFound(); // non-admins get a plain 404, not a hint that the page exists

  const [{ lang, t }, pending, approved, rejected] = await Promise.all([
    getTranslator(),
    listPaymentsForAdmin("pending"),
    listPaymentsForAdmin("approved", 15),
    listPaymentsForAdmin("rejected", 15),
  ]);
  const reviewed = [...approved, ...rejected]
    .sort((a, b) => (b.reviewedAt?.getTime() ?? 0) - (a.reviewedAt?.getTime() ?? 0))
    .slice(0, 20);

  const who = (p: AdminPaymentRow) => (
    <span className="min-w-0">
      <span className="block truncate font-lao font-semibold">{p.name}</span>
      <span className="block truncate text-xs text-muted">{p.email}</span>
    </span>
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <p className="font-lao text-xs font-semibold uppercase tracking-wide text-accent">{t("admin")}</p>
        <h1 className="font-lao text-2xl font-bold">{t("adminPayments")}</h1>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-lao text-sm font-semibold">
          {t("pendingPayments")} <span className="text-muted">({pending.length})</span>
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface px-5 py-8 text-center font-lao text-muted">
            {t("noPending")}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {pending.map((p) => (
              <article key={p.id} className="flex gap-4 rounded-2xl border border-line bg-surface p-4">
                <a href={`/api/premium/slips/${p.id}`} target="_blank" className="shrink-0" title={t("viewSlip")}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- private slip served by our API */}
                  <img
                    src={`/api/premium/slips/${p.id}`}
                    alt={t("viewSlip")}
                    className="h-40 w-28 rounded-lg border border-line bg-bg object-cover"
                  />
                </a>
                <div className="flex min-w-0 flex-1 flex-col gap-2 text-sm">
                  {who(p)}
                  <p className="font-lao">
                    <b className="font-mono">{formatLak(p.amountLak)}</b> · {p.months} {t("monthsUnit")}
                  </p>
                  <p className="font-lao text-xs text-muted">
                    {formatDate(p.createdAt, lang)}
                    <br />
                    {t("currentPremium")}:{" "}
                    {isActive(p.premiumUntil) ? formatDate(p.premiumUntil!, lang, false) : t("none")}
                  </p>
                  <AdminPaymentActions id={p.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {reviewed.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-line bg-surface">
          <h2 className="border-b border-line px-4 py-3 font-lao text-sm font-semibold">{t("recentlyReviewed")}</h2>
          <ul className="divide-y divide-line text-sm">
            {reviewed.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                {who(p)}
                <span className="font-lao text-xs text-muted">
                  {formatLak(p.amountLak)} · {p.months} {t("monthsUnit")} · {formatDate(p.reviewedAt!, lang)} {t("by")}{" "}
                  {p.reviewedBy}
                  {p.reviewNote && <span className="block text-error">{p.reviewNote}</span>}
                </span>
                <span className="flex items-center gap-3">
                  <a
                    href={`/api/premium/slips/${p.id}`}
                    target="_blank"
                    className="font-lao text-xs text-accent hover:underline"
                  >
                    {t("viewSlip")}
                  </a>
                  <span className={`rounded-full px-2.5 py-0.5 font-lao text-xs font-medium ${STATUS_STYLE[p.status]}`}>
                    {t(STATUS_LABEL[p.status])}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
