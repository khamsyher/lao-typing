import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import ClaimCertificateButton from "@/components/ClaimCertificateButton";
import { getCourseProgress } from "@/lib/certificates";
import { MIN_ACCURACY } from "@/lib/courses";
import { requireAccounts } from "@/lib/features";
import { formatDate } from "@/lib/format";
import { getTranslator } from "@/lib/i18n-server";
import { labelForKey } from "@/lib/modes";
import { getViewer } from "@/lib/premium";

export const metadata: Metadata = { title: "Certificates · Lao Typing" };

export default function CertificatesPage() {
  requireAccounts();
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6" />}>
      <Certificates />
    </Suspense>
  );
}

async function Certificates() {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in?next=/certificates");
  const [{ lang, t }, progress] = await Promise.all([getTranslator(), getCourseProgress(viewer.id)]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6">
      <div>
        <h1 className="font-lao text-2xl font-bold">🎓 {t("certificates")}</h1>
        <p className="font-lao text-sm text-muted">{t("certificatesSubtitle")}</p>
      </div>

      {!viewer.isPremium && (
        <Link
          href="/premium"
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/5 px-5 py-4 font-lao"
        >
          <span>★ {t("featCertificates")} — {t("premiumLocked")}</span>
          <span className="font-medium text-accent">{t("unlockPremium")} →</span>
        </Link>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {progress.map(({ course, requirements, complete, certificate }) => {
          const doneCount = requirements.filter((r) => r.done).length;
          return (
            <article key={course.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-lao text-lg font-semibold">{course.title[lang]}</h2>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 font-lao text-xs font-medium ${
                      complete ? "bg-success/15 text-success" : "bg-line text-muted"
                    }`}
                  >
                    {complete ? t("completed") : `${doneCount}/${requirements.length}`}
                  </span>
                </div>
                <p className="mt-1 font-lao text-sm text-muted">{course.description[lang]}</p>
              </div>

              <ul className="flex flex-col gap-1.5 text-sm">
                {requirements.map((r) => (
                  <li key={r.modeKey} className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2 font-lao">
                      <span className={r.done ? "text-success" : "text-muted"} aria-hidden>
                        {r.done ? "✓" : "○"}
                      </span>
                      <span className="truncate">{labelForKey(r.modeKey, lang)}</span>
                    </span>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-muted">
                      {r.bestWpm !== null ? Math.round(r.bestWpm) : "–"} / {r.minWpm} {t("wpm")}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="font-lao text-xs text-muted">
                {t("accuracy")} ≥ {MIN_ACCURACY}%
              </p>

              <div className="mt-auto">
                {certificate ? (
                  <Link
                    href={`/certificate/${certificate.id}`}
                    className="block rounded-lg bg-accent px-4 py-2 text-center font-lao text-sm font-medium text-accent-fg hover:opacity-90"
                  >
                    {t("viewCertificate")} · {formatDate(certificate.issuedAt, lang, false)}
                  </Link>
                ) : complete && viewer.isPremium ? (
                  <ClaimCertificateButton course={course.id} />
                ) : complete ? (
                  <Link
                    href="/premium"
                    className="block rounded-lg border border-accent px-4 py-2 text-center font-lao text-sm font-medium text-accent"
                  >
                    ★ {t("unlockPremium")}
                  </Link>
                ) : (
                  <p className="rounded-lg bg-bg px-4 py-2 text-center font-lao text-sm text-muted">{t("notYet")}</p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </main>
  );
}
