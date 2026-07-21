import Link from "next/link";
import { NewInvoiceDialog } from "@/components/dashboard/new-invoice-dialog";
import { Sparkles } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-[0.5]" />
      <header className="sticky top-0 z-40 border-b border-white/5 bg-[rgba(11,15,26,0.72)] backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-400/90 to-emerald-600/90 shadow-[0_0_24px_-4px_rgba(52,211,153,0.6)]">
              <Sparkles className="h-4 w-4 text-[#052e22]" strokeWidth={2.5} />
              <span className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20" />
            </span>
            <div className="leading-tight">
              <div className="font-semibold tracking-tight text-foreground">Aria</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                Autonomous AR
              </div>
            </div>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 text-sm text-muted-foreground md:flex">
            <Link
              href="/"
              className="rounded-md px-3 py-1.5 transition-colors hover:bg-white/5 hover:text-foreground"
            >
              Dashboard
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-2.5 py-1 text-[11px] text-emerald-300 sm:flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
              </span>
              Pinch sandbox · live
            </span>
            <NewInvoiceDialog />
          </div>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  );
}
