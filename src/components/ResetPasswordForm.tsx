"use client";

import Link from "next/link";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useLang } from "./LangProvider";

export default function ResetPasswordForm({ token, invalid }: { token?: string; invalid: boolean }) {
  const { t } = useLang();
  const [pending, setPending] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(invalid ? t("invalidResetLink") : null);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password") ?? "");
    const confirmation = String(form.get("confirmation") ?? "");
    if (newPassword !== confirmation) {
      setError(t("passwordMismatch"));
      return;
    }
    if (!token) {
      setError(t("invalidResetLink"));
      return;
    }

    setPending(true);
    setError(null);
    const result = await authClient.resetPassword({ newPassword, token });
    setPending(false);
    if (result.error) {
      setError(result.error.message || t("invalidResetLink"));
      return;
    }
    setComplete(true);
  };

  const field =
    "w-full rounded-lg border border-line bg-bg px-3 py-2 font-lao text-fg outline-none transition-colors focus:border-accent";

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <h1 className="font-lao text-2xl font-bold">{t("resetPasswordTitle")}</h1>
      <p className="mt-1 font-lao text-sm text-muted">{t("resetPasswordSubtitle")}</p>

      {complete ? (
        <div className="mt-6 flex flex-col gap-4">
          <p role="status" className="rounded-lg bg-accent/10 px-3 py-2 font-lao text-sm">
            {t("passwordResetSuccess")}
          </p>
          <Link
            href="/sign-in"
            className="rounded-lg bg-accent px-4 py-2.5 text-center font-lao text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
          >
            {t("signIn")}
          </Link>
        </div>
      ) : invalid ? (
        <div className="mt-6 flex flex-col gap-4">
          <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 font-lao text-sm text-error">
            {t("invalidResetLink")}
          </p>
          <Link href="/forgot-password" className="font-lao text-sm text-accent hover:underline">
            {t("requestAnotherReset")}
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 font-lao text-sm">
            {t("newPassword")}
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={field}
            />
          </label>
          <label className="flex flex-col gap-1.5 font-lao text-sm">
            {t("confirmPassword")}
            <input
              name="confirmation"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className={field}
            />
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
            {pending ? t("pleaseWait") : t("resetPasswordAction")}
          </button>
        </form>
      )}
    </div>
  );
}
