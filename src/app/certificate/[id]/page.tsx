import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Logo from "@/components/Logo";
import PrintButton from "@/components/PrintButton";
import { getCertificate } from "@/lib/certificates";
import { findCourse } from "@/lib/courses";
import { requireAccounts } from "@/lib/features";
import { formatDate } from "@/lib/format";
import { getTranslator } from "@/lib/i18n-server";

export const metadata: Metadata = { title: "Certificate · Lao Typing" };

// Public: anyone with the link can view and verify a certificate. The ID is random and unguessable.
export default function CertificatePage({ params }: { params: Promise<{ id: string }> }) {
  requireAccounts();
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <Certificate params={params} />
    </Suspense>
  );
}

async function Certificate({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ lang, t }, cert] = await Promise.all([getTranslator(), getCertificate(id)]);
  const course = cert && findCourse(cert.course);
  if (!cert || !course) notFound();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-6 px-4 py-8 print:max-w-none print:p-0">
      <article className="relative w-full overflow-hidden rounded-3xl border-[3px] border-accent/70 bg-surface p-2 shadow-sm print:rounded-none print:shadow-none">
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-accent/30 px-6 py-12 text-center sm:px-14">
          <Logo />
          <p className="font-lao text-sm font-semibold uppercase tracking-[0.2em] text-accent">{t("certificateTitle")}</p>
          <p className="font-lao text-muted">{t("certifies")}</p>
          <h1 className="font-lao text-4xl font-bold leading-tight sm:text-5xl">{cert.holderName}</h1>
          <p className="font-lao text-muted">{t("hasCompleted")}</p>
          <h2 className="font-lao text-2xl font-semibold text-accent">{course.title[lang]}</h2>
          <p className="max-w-md font-lao text-sm text-muted">{course.description[lang]}</p>

          <div className="mt-2 flex gap-8">
            <div>
              <div className="font-mono text-3xl font-bold tabular-nums">{Math.round(cert.wpm)}</div>
              <div className="font-lao text-xs text-muted">{t("wpm")}</div>
            </div>
            <div>
              <div className="font-mono text-3xl font-bold tabular-nums">{Math.round(cert.accuracy)}%</div>
              <div className="font-lao text-xs text-muted">{t("accuracy")}</div>
            </div>
          </div>

          <div className="mt-6 grid w-full gap-4 border-t border-line pt-6 font-lao text-sm sm:grid-cols-2">
            <p>
              <span className="block text-xs text-muted">{t("issuedOn")}</span>
              {formatDate(cert.issuedAt, lang, false)}
            </p>
            <p>
              <span className="block text-xs text-muted">{t("certificateId")}</span>
              <span className="font-mono">{cert.id}</span>
            </p>
          </div>
          <p className="font-lao text-xs text-muted">
            ພິມລາວ · Lao Typing — {t("verifyAt")} /certificate/{cert.id}
          </p>
        </div>
      </article>
      <PrintButton label={t("printCertificate")} />
    </main>
  );
}
