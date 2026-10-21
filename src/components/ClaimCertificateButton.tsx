"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLang } from "./LangProvider";

export default function ClaimCertificateButton({ course }: { course: string }) {
  const { t } = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const claim = async () => {
    setBusy(true);
    setError(false);
    const res = await fetch("/api/certificates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ course }),
    }).catch(() => null);
    if (res?.ok) {
      const { id } = (await res.json()) as { id: string };
      router.push(`/certificate/${id}`);
      return;
    }
    setBusy(false);
    setError(true);
  };

  return (
    <>
      <button
        onClick={claim}
        disabled={busy}
        className="w-full rounded-lg bg-accent px-4 py-2 font-lao text-sm font-medium text-accent-fg hover:opacity-90 disabled:opacity-50"
      >
        🎓 {busy ? t("pleaseWait") : t("claimCertificate")}
      </button>
      {error && <p className="mt-2 font-lao text-xs text-error">{t("certificateError")}</p>}
    </>
  );
}
