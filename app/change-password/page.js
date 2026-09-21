import { LockKeyhole } from "lucide-react";
import { load } from "@/lib/api";
import { Logo } from "@/components/brand";
import { Card } from "@/components/ui";
import { ChangePasswordForm } from "@/components/change-password-form";

export const metadata = { title: "Set your password" };

export default async function ChangePasswordPage() {
  const { user } = await load("/auth/me");
  const first = user.mustChangePassword;
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <Logo className="mb-8" />
        <Card className="p-7">
          <span className="mb-5 grid size-11 place-items-center rounded-xl border border-brand-500/30 bg-brand-500/10 text-brand-300">
            <LockKeyhole className="size-5" />
          </span>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {first ? `Welcome, ${user.name.split(" ")[0]}` : "Change password"}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {first
              ? "Before you continue, replace the temporary password your admin gave you with one only you know."
              : "Pick a new password with at least 8 characters, including a letter and a number."}
          </p>
          <ChangePasswordForm cancelHref={first ? null : user.role === "admin" ? "/admin" : "/employee/profile"} />
        </Card>
        {first && (
          <a href="/logout" className="mt-6 block text-center text-xs text-subtle hover:text-muted">
            Not you? Sign out
          </a>
        )}
      </div>
    </main>
  );
}
