import { redirect } from "next/navigation";
import { Suspense } from "react";
import AuthForm from "./AuthForm";
import { getSession, googleEnabled } from "@/lib/auth";
import { requireAccounts } from "@/lib/features";
import { safeNext, type SearchParams } from "@/lib/redirect";

interface Props {
  mode: "sign-in" | "sign-up";
  searchParams: SearchParams;
}

// The page frame renders immediately; reading ?next= / ?error= (URL data) and the session
// happens inside <Suspense>, so the route's shell stays instant on navigation.
export default function AuthPage({ mode, searchParams }: Props) {
  requireAccounts();
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
      <Suspense fallback={<AuthFormSkeleton />}>
        <AuthGate mode={mode} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function AuthGate({ mode, searchParams }: Props) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getSession()) redirect(next);
  return <AuthForm mode={mode} googleEnabled={googleEnabled} next={next} oauthError={!!params.error} />;
}

function AuthFormSkeleton() {
  return (
    <div className="mx-auto w-full max-w-sm animate-pulse rounded-2xl border border-line bg-surface p-6 sm:p-8" aria-hidden>
      <div className="h-7 w-2/3 rounded bg-line" />
      <div className="mt-3 h-4 w-full rounded bg-line/70" />
      <div className="mt-8 flex flex-col gap-5">
        {[0, 1].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="h-4 w-1/4 rounded bg-line/70" />
            <div className="h-10 rounded-lg bg-line/50" />
          </div>
        ))}
        <div className="h-10 rounded-lg bg-accent/30" />
      </div>
    </div>
  );
}
