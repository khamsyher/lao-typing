import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import PremiumCheckout from "@/components/PremiumCheckout";
import { requireAccounts } from "@/lib/features";
import { formatDate } from "@/lib/format";
import type { StringKey } from "@/lib/i18n";
import { getTranslator } from "@/lib/i18n-server";
import {
  MONTH_OPTIONS,
  PRICE_PER_MONTH_LAK,
  getViewer,
  listMyPayments,
  paymentDetails,
} from "@/lib/premium";
import { STATUS_LABEL, STATUS_STYLE, formatLak } from "@/lib/premium-ui";

export const metadata: Metadata = {
  title: "Premium · Lao Typing",
  description: "Lao Typing Premium — 50,000 LAK per month for weak-key training, reports, custom text and certificates.",
};

const FEATURES: { icon: string; key: StringKey }[] = [
  { icon: "🎯", key: "featWeakKeys" },
  { icon: "📈", key: "featReports" },
  { icon: "✍️", key: "featCustom" },
  { icon: "🎓", key: "featCertificates" },
];

export default function PremiumPage() {
  requireAccounts();
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6" />}>
      <Premium />
    </Suspense>
  );
}

async function Premium() {
  const [{ lang, t }, viewer] = await Promise.all([getTranslator(), getViewer()]);
  const payments = viewer ? await listMyPayments(viewer.id) : [];
  const pending = payments.find((p) => p.status === "pending");

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* Plan */}
        <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
          <p className="inline-flex rounded-full bg-accent/10 px-3 py-1 font-lao text-xs font-semibold text-accent">
            ★ {t("premium")}
          </p>
          <h1 className="mt-3 font-lao text-2xl font-bold">{t("premiumTitle")}</h1>
          <p className="mt-1 font-lao text-sm text-muted">{t("premiumSubtitle")}</p>
          <p className="mt-6 flex items-baseline gap-2">
            <span className="font-mono text-4xl font-bold tabular-nums">{PRICE_PER_MONTH_LAK.toLocaleString("en-US")}</span>
            <span className="font-lao text-lg font-semibold">₭</span>
            <span className="font-lao text-muted">{t("perMonth")}</span>
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li key={f.key} className="flex items-start gap-3 font-lao">
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-accent/10 text-base" aria-hidden>
                  {f.icon}
                </span>
                <span className="pt-1">{t(f.key)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-6 border-t border-line pt-4 font-lao text-sm text-muted">✓ {t("freeIncludes")}</p>
        </section>

        {/* Status + checkout */}
        <section className="flex flex-col gap-4">
          {viewer?.premiumUntil && (
            <div
              className={`rounded-2xl border px-5 py-4 font-lao ${
                viewer.isPremium ? "border-success/40 bg-success/10" : "border-line bg-surface"
              }`}
            >
              {viewer.isPremium ? `★ ${t("premiumActiveUntil")}` : t("premiumExpired")}{" "}
              <b>{formatDate(viewer.premiumUntil, lang, false)}</b>
            </div>
          )}

          {!viewer ? (
            <div className="flex flex-col items-start gap-4 rounded-2xl border border-line bg-surface p-6">
              <p className="font-lao text-muted">{t("signInSubtitle")}</p>
              <Link
                href="/sign-in?next=/premium"
                className="rounded-lg bg-accent px-5 py-2.5 font-lao text-sm font-medium text-accent-fg hover:opacity-90"
              >
                {t("signInToSubscribe")} →
              </Link>
            </div>
          ) : pending ? (
            <div className="rounded-2xl border border-warn/40 bg-warn/10 p-6 font-lao">
              <p className="font-semibold">⏳ {t("pendingReview")}</p>
              <p className="mt-1 text-sm text-muted">
                {pending.months} {t("monthsUnit")} · {formatLak(pending.amountLak)} ·{" "}
                {formatDate(pending.createdAt, lang)}
              </p>
            </div>
          ) : (
            <PremiumCheckout
              pricePerMonth={PRICE_PER_MONTH_LAK}
              monthOptions={[...MONTH_OPTIONS]}
              payment={paymentDetails()}
              cta={viewer.isPremium ? t("extend") : t("subscribe")}
            />
          )}

          {payments.length > 0 && (
            <div className="rounded-2xl border border-line bg-surface p-5">
              <h2 className="mb-3 font-lao text-sm font-semibold">{t("paymentHistory")}</h2>
              <ul className="divide-y divide-line text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <span className="font-lao">
                      {formatDate(p.createdAt, lang)} · {p.months} {t("monthsUnit")} · {formatLak(p.amountLak)}
                      {p.status === "rejected" && p.reviewNote && (
                        <span className="block text-xs text-error">{p.reviewNote}</span>
                      )}
                    </span>
                    <span className="flex items-center gap-3">
                      <a href={`/api/premium/slips/${p.id}`} target="_blank" className="font-lao text-xs text-accent hover:underline">
                        {t("viewSlip")}
                      </a>
                      <span className={`rounded-full px-2.5 py-0.5 font-lao text-xs font-medium ${STATUS_STYLE[p.status]}`}>
                        {t(STATUS_LABEL[p.status])}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
