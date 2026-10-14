import { LangProvider } from "./LangProvider";
import Logo from "./Logo";
import SiteHeader from "./SiteHeader";
import { getSession } from "@/lib/auth";
import { accountsEnabled } from "@/lib/features";
import { getLang } from "@/lib/i18n-server";

// Everything that depends on the request (language cookie, session). The root layout renders
// it inside <Suspense>, so the static shell is prerendered and this streams in per request.
export default async function AppShell({ children }: { children: React.ReactNode }) {
  const [lang, session] = await Promise.all([getLang(), getSession()]);
  const user = session ? { name: session.user.name, email: session.user.email } : null;
  return (
    <LangProvider initial={lang}>
      <SiteHeader user={user} accountsEnabled={accountsEnabled} />
      {children}
    </LangProvider>
  );
}

export function AppShellFallback() {
  return (
    <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 pt-6" aria-hidden>
      <Logo />
      <span className="font-lao text-xl font-bold">ພິມລາວ · Lao Typing</span>
    </div>
  );
}
