import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";
import type { SearchParams } from "@/lib/redirect";

export const metadata: Metadata = { title: "Create account · Lao Typing" };

export default function SignUpPage({ searchParams }: { searchParams: SearchParams }) {
  return <AuthPage mode="sign-up" searchParams={searchParams} />;
}
