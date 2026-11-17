"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useLang } from "./LangProvider";

export default function ForgotPasswordForm() {
  const { t } = useLang();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    setPending(true);
    setError(null);
    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message || t("authError"));
      return;
    }
    setSent(true);
  };

  const field =
    "w-full rounded-lg border border-line bg-bg px-3 py-2 font-lao text-fg outline-none transition-colors focus:border-accent";

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <h1 className="font-lao text-2xl font-bold">{t("forgotPasswordTitle")}</h1>
      <p className="mt-1 font-lao text-sm text-muted">{t("forgotPasswordSubtitle")}</p>

      {sent ? (
        <p role="status" className="mt-6 rounded-lg bg-accent/10 px-3 py-2 font-lao text-sm">
          {t("resetEmailSent")}
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 font-lao text-sm">
            {t("email")}
            <input name="email" type="email" required autoComplete="email" className={field} />
          </label>
          {error && (
            <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 font-lao text-sm text-error">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-accent px-4 py-2.5 font-lao text-sm font-medium text-accent-fg transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {pending ? t("pleaseWait") : t("sendResetLink")}
          </button>
        </form>
      )}

      <p className="mt-6 text-center font-lao text-sm text-muted">
        <Link href="/sign-in" className="text-accent hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
