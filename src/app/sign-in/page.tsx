import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";
import type { SearchParams } from "@/lib/redirect";

export const metadata: Metadata = { title: "Sign in · Lao Typing" };

export default function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  return <AuthPage mode="sign-in" searchParams={searchParams} />;
}
