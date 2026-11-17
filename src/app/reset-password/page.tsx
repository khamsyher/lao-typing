import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { passwordResetEnabled } from "@/lib/auth";
import { requireAccounts } from "@/lib/features";
import type { SearchParams } from "@/lib/redirect";

export const metadata: Metadata = { title: "Reset password · Lao Typing" };

export default async function ResetPasswordPage({ searchParams }: { searchParams: SearchParams }) {
  requireAccounts();
  if (!passwordResetEnabled) redirect("/sign-in");

  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  return (
    <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
      <ResetPasswordForm token={token} invalid={!token || !!params.error} />
    </main>
  );
}
