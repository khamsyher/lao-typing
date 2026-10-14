"use client"; // Error boundaries must be Client Components

import Link from "next/link";
import { useEffect } from "react";
import { useLang } from "@/components/LangProvider";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { t } = useLang();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-start justify-center px-4 py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center">
        <p className="text-4xl" aria-hidden>
          ⚠️
        </p>
        <h1 className="mt-3 font-lao text-xl font-bold">{t("errorTitle")}</h1>
        <p className="mt-2 font-lao text-sm text-muted">{t("errorBody")}</p>
        {error.digest && <p className="mt-3 font-mono text-xs text-muted">ref: {error.digest}</p>}
        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg border border-line px-4 py-2 font-lao text-sm transition-colors hover:border-accent hover:text-accent"
          >
            {t("practice")}
          </Link>
          <button
            onClick={() => retry()}
            className="rounded-lg bg-accent px-5 py-2 font-lao text-sm font-medium text-accent-fg hover:opacity-90"
          >
            {t("tryAgain")}
          </button>
        </div>
      </div>
    </main>
  );
}
