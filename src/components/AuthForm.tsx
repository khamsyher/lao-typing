"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useLang } from "./LangProvider";

interface Props {
  mode: "sign-in" | "sign-up";
  googleEnabled: boolean;
  next: string;
  oauthError?: boolean;
}

export default function AuthForm({ mode, googleEnabled, next, oauthError = false }: Props) {
  const { t } = useLang();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(oauthError ? t("googleError") : null);
  const isSignUp = mode === "sign-up";

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    setPending(true);
    setError(null);
    const { error } = isSignUp
      ? await authClient.signUp.email({ name: String(form.get("name") ?? "").trim(), email, password })
      : await authClient.signIn.email({ email, password });
    setPending(false);
    if (error) {
      setError(error.message || t("authError"));
      return;
    }
    router.push(next);
    router.refresh();
  };

  const google = async () => {
    setPending(true);
    setError(null);
    const errorURL = `/${mode}?error=google${next !== "/" ? `&next=${encodeURIComponent(next)}` : ""}`;
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: next, errorCallbackURL: errorURL });
    if (error) {
      setPending(false);
      setError(t("googleError"));
    }
  };

  const field =
    "w-full rounded-lg border border-line bg-bg px-3 py-2 font-lao text-fg outline-none transition-colors focus:border-accent";

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-line bg-surface p-6 sm:p-8">
      <h1 className="font-lao text-2xl font-bold">{isSignUp ? t("signUpTitle") : t("signInTitle")}</h1>
      <p className="mt-1 font-lao text-sm text-muted">{isSignUp ? t("signUpSubtitle") : t("signInSubtitle")}</p>

      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={google}
            disabled={pending}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-bg px-4 py-2 font-lao text-sm transition-colors hover:border-accent disabled:opacity-50"
          >
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
              <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.1-4 1.1-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24z" />
              <path fill="#FBBC05" d="M5.4 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1z" />
              <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
            </svg>
            {t("continueWithGoogle")}
          </button>
          <div className="my-5 flex items-center gap-3 font-lao text-xs text-muted">
            <span className="h-px flex-1 bg-line" />
            {t("or")}
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className={`flex flex-col gap-4 ${googleEnabled ? "" : "mt-6"}`}>
        {isSignUp && (
          <label className="flex flex-col gap-1.5 font-lao text-sm">
            {t("name")}
            <input name="name" required maxLength={40} autoComplete="nickname" className={field} />
          </label>
        )}
        <label className="flex flex-col gap-1.5 font-lao text-sm">
          {t("email")}
          <input name="email" type="email" required autoComplete="email" className={field} />
        </label>
        <label className="flex flex-col gap-1.5 font-lao text-sm">
          {t("password")}
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            className={field}
          />
          {isSignUp && <span className="text-xs text-muted">{t("passwordHint")}</span>}
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
          {pending ? t("pleaseWait") : isSignUp ? t("signUp") : t("signIn")}
        </button>
      </form>

      <p className="mt-6 text-center font-lao text-sm text-muted">
        {isSignUp ? t("haveAccount") : t("noAccount")}{" "}
        <Link
          href={`${isSignUp ? "/sign-in" : "/sign-up"}${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`}
          className="text-accent hover:underline"
        >
          {isSignUp ? t("signIn") : t("signUp")}
        </Link>
      </p>
    </div>
  );
}
