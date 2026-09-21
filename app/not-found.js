import { Compass } from "lucide-react";
import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="flex min-h-[70dvh] items-center justify-center px-5">
      <div className="glass max-w-md rounded-2xl p-8 text-center">
        <span className="mx-auto mb-5 grid size-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-brand-300">
          <Compass className="size-5" />
        </span>
        <p className="font-display text-5xl font-semibold text-gradient">404</p>
        <p className="mt-2 text-sm text-muted">This page doesn&apos;t exist or you don&apos;t have access to it.</p>
        <LinkButton href="/" className="mt-6">
          Go home
        </LinkButton>
      </div>
    </main>
  );
}
