"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatLak } from "@/lib/premium-ui";
import { useLang } from "./LangProvider";

const MAX_BYTES = 3 * 1024 * 1024;

interface Props {
  pricePerMonth: number;
  monthOptions: number[];
  payment: { bank: string | null; accountName: string | null; accountNumber: string | null; qrImage: string | null };
  cta: string;
}

export default function PremiumCheckout({ pricePerMonth, monthOptions, payment, cta }: Props) {
  const { t } = useLang();
  const router = useRouter();
  const [months, setMonths] = useState(monthOptions[0]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const configured = !!(payment.accountNumber || payment.qrImage);

  // Free the preview's object URL when it is replaced or the form goes away.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const pick = (f: File | null) => {
    setError(null);
    const ok = f && f.size <= MAX_BYTES;
    if (f && !ok) setError(t("slipTooLarge"));
    setFile(ok ? f : null);
    setPreview(ok ? URL.createObjectURL(f) : null);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setStatus("sending");
    setError(null);
    const body = new FormData();
    body.set("months", String(months));
    body.set("slip", file);
    const res = await fetch("/api/premium/payments", { method: "POST", body }).catch(() => null);
    if (res?.ok) {
      setStatus("sent");
      router.refresh();
    } else {
      setStatus("error");
      const msg = res ? ((await res.json().catch(() => null)) as { error?: string } | null)?.error : null;
      setError(`${t("slipError")}${msg ? ` — ${msg}` : ""}`);
    }
  };

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-success/40 bg-success/10 p-6 font-lao font-medium">✓ {t("slipSent")}</div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6">
      <h2 className="font-lao text-lg font-semibold">{t("howToPay")}</h2>

      {/* 1. Months */}
      <div>
        <p className="mb-2 font-lao text-sm text-muted">1. {t("payStep1")}</p>
        <div className="grid grid-cols-4 gap-2">
          {monthOptions.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonths(m)}
              className={`rounded-xl border px-2 py-2.5 text-center transition-colors ${
                months === m ? "border-accent bg-accent/10 text-accent" : "border-line hover:border-fg/30"
              }`}
            >
              <span className="block font-mono text-lg font-semibold">{m}</span>
              <span className="block font-lao text-xs text-muted">{t("monthsUnit")}</span>
            </button>
          ))}
        </div>
        <p className="mt-3 flex items-baseline justify-between rounded-xl bg-bg px-4 py-3 font-lao">
          <span className="text-muted">{t("total")}</span>
          <span className="font-mono text-xl font-bold tabular-nums">{formatLak(months * pricePerMonth)}</span>
        </p>
      </div>

      {/* 2. Pay */}
      <div>
        <p className="mb-2 font-lao text-sm text-muted">2. {t("payStep2")}</p>
        {configured ? (
          <div className="flex flex-col gap-4 rounded-xl border border-line p-4 sm:flex-row sm:items-center">
            {payment.qrImage && (
              <figure className="shrink-0 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element -- admin-provided QR, any size */}
                <img
                  src={payment.qrImage}
                  alt={t("scanToPay")}
                  className="mx-auto size-40 rounded-lg border border-line bg-white object-contain p-1"
                />
                <figcaption className="mt-1 font-lao text-xs text-muted">{t("scanToPay")}</figcaption>
              </figure>
            )}
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 font-lao text-sm">
              {payment.bank && (
                <>
                  <dt className="text-muted">{t("bank")}</dt>
                  <dd className="font-medium">{payment.bank}</dd>
                </>
              )}
              {payment.accountName && (
                <>
                  <dt className="text-muted">{t("accountName")}</dt>
                  <dd className="font-medium">{payment.accountName}</dd>
                </>
              )}
              {payment.accountNumber && (
                <>
                  <dt className="text-muted">{t("accountNumber")}</dt>
                  <dd className="font-mono font-semibold tracking-wide">{payment.accountNumber}</dd>
                </>
              )}
              <dt className="text-muted">{t("total")}</dt>
              <dd className="font-mono font-semibold">{formatLak(months * pricePerMonth)}</dd>
            </dl>
          </div>
        ) : (
          <p className="rounded-xl bg-warn/10 px-4 py-3 font-lao text-sm">{t("paymentNotConfigured")}</p>
        )}
      </div>

      {/* 3. Slip */}
      <div>
        <p className="mb-2 font-lao text-sm text-muted">3. {t("payStep3")}</p>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-line px-4 py-6 text-center transition-colors hover:border-accent">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element -- local preview (blob: URL)
            <img src={preview} alt="" className="max-h-56 rounded-lg object-contain" />
          ) : (
            <span className="text-3xl" aria-hidden>
              🧾
            </span>
          )}
          <span className="font-lao text-sm text-muted">{file ? file.name : t("uploadSlip")}</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => pick(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 font-lao text-sm text-error">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!file || status === "sending" || !configured}
        className="rounded-lg bg-accent px-5 py-3 font-lao font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        {status === "sending" ? t("pleaseWait") : `${cta} · ${t("sendSlip")}`}
      </button>
    </form>
  );
}
