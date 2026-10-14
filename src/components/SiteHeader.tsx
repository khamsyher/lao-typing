"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import type { Lang } from "@/lib/i18n";
import { save } from "@/lib/storage";
import { useLang } from "./LangProvider";
import Logo from "./Logo";

export interface HeaderUser {
  name: string;
  email: string;
}

export default function SiteHeader({ user }: { user: HeaderUser | null }) {
  const { lang, setLang, t } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const nav = [
    { href: "/", label: t("practice") },
    { href: "/leaderboard", label: t("leaderboard") },
    ...(user ? [{ href: "/history", label: t("myHistory") }] : []),
  ];

  const signOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    setSigningOut(false);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 pt-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link href="/" className="flex items-center gap-3">
          <Logo />
          <span>
            <span className="block font-lao text-xl font-bold leading-tight">ພິມລາວ · Lao Typing</span>
            <span className="block font-lao text-sm text-muted">{t("tagline")}</span>
          </span>
        </Link>
        <nav className="flex gap-1">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-1.5 font-lao text-sm transition-colors ${
                  active ? "bg-surface text-fg shadow-sm ring-1 ring-line" : "text-muted hover:text-fg"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-line bg-surface p-0.5 text-sm">
          {(["lo", "en"] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`rounded-md px-3 py-1 font-lao transition-colors ${
                lang === l ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"
              }`}
            >
              {l === "lo" ? "ລາວ" : "EN"}
            </button>
          ))}
        </div>
        <ThemeToggle />
        {user ? (
          <div className="flex items-center gap-2">
            <span
              title={user.email}
              className="grid size-9 place-items-center rounded-full bg-accent/15 font-lao text-sm font-semibold text-accent"
            >
              {initial(user.name)}
            </span>
            <span className="hidden max-w-32 truncate font-lao text-sm sm:inline">{user.name}</span>
            <button
              onClick={signOut}
              disabled={signingOut}
              className="rounded-lg border border-line bg-surface px-3 py-1.5 font-lao text-sm text-muted transition-colors hover:text-fg disabled:opacity-50"
            >
              {t("signOut")}
            </button>
          </div>
        ) : (
          <Link
            href="/sign-in"
            className="rounded-lg bg-accent px-4 py-1.5 font-lao text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
          >
            {t("signIn")}
          </Link>
        )}
      </div>
    </header>
  );
}

const initial = (name: string) => Array.from(name.trim())[0]?.toUpperCase() ?? "?";

function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    save("theme", next);
  };
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:text-fg"
    >
      <svg viewBox="0 0 24 24" className="size-4.5 fill-none stroke-current stroke-2" aria-hidden>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  );
}
