import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { passwordResetEnabled } from "@/lib/auth";
import { requireAccounts } from "@/lib/features";

export const metadata: Metadata = { title: "Forgot password · Lao Typing" };

export default function ForgotPasswordPage() {
  requireAccounts();
  if (!passwordResetEnabled) redirect("/sign-in");

  return (
    <main className="flex flex-1 items-start justify-center px-4 py-10 sm:py-16">
      <ForgotPasswordForm />
    </main>
  );
}
