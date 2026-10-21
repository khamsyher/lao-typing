"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLang } from "./LangProvider";

export default function AdminPaymentActions({ id }: { id: number }) {
  const { t } = useLang();
  const router = useRouter();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async (action: "approve" | "reject") => {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/payments/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      router.refresh();
      return;
    }
    const body = res ? ((await res.json().catch(() => null)) as { error?: string } | null) : null;
    setError(body?.error ?? "network error");
  };

  return (
    <div className="mt-auto flex flex-col gap-2">
      {rejecting ? (
        <>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder={t("rejectReason")}
            className="rounded-lg border border-line bg-bg px-3 py-1.5 font-lao text-sm outline-none focus:border-accent"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => send("reject")}
              disabled={busy || !note.trim()}
              className="rounded-lg bg-error px-3 py-1.5 font-lao text-sm font-medium text-white disabled:opacity-40"
            >
              {t("reject")}
            </button>
            <button onClick={() => setRejecting(false)} className="rounded-lg px-3 py-1.5 font-lao text-sm text-muted">
              ✕
            </button>
          </div>
        </>
      ) : (
        <div className="flex gap-2">
          <button
            onClick={() => send("approve")}
            disabled={busy}
            className="rounded-lg bg-success px-3 py-1.5 font-lao text-sm font-medium text-white disabled:opacity-40"
          >
            ✓ {t("approve")}
          </button>
          <button
            onClick={() => setRejecting(true)}
            disabled={busy}
            className="rounded-lg border border-line px-3 py-1.5 font-lao text-sm text-muted hover:border-error hover:text-error"
          >
            {t("reject")}
          </button>
        </div>
      )}
      {error && <p className="font-lao text-xs text-error">{error}</p>}
    </div>
  );
}
