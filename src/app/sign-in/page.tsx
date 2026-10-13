import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AuthForm from "@/components/AuthForm";
import { getSession, googleEnabled } from "@/lib/auth";
import { safeNext, type SearchParams } from "@/lib/redirect";

export const metadata: Metadata = { title: "Sign in · Lao Typing" };

export default async function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getSession()) redirect(next);
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
      <AuthForm mode="sign-in" googleEnabled={googleEnabled} next={next} oauthError={!!params.error} />
    </main>
  );
}
