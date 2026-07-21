"use client";

import { CountUp } from "@/components/motion/count-up";
import { formatMoney } from "@/lib/utils";

interface HeroCounterProps {
  recoveredCents: number;
  invoiceCount: number;
  hoursSaved: number;
}

export function HeroCounter({ recoveredCents, invoiceCount, hoursSaved }: HeroCounterProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-7 sm:p-9">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-10 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />

      <div className="relative flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        <span className="h-px w-6 bg-emerald-400/50" />
        Cash recovered today
      </div>

      <div className="relative mt-3 flex items-end gap-4">
        <div className="text-gradient-emerald text-[clamp(2.75rem,9vw,5.25rem)] font-semibold leading-none tracking-tight tabular">
          <CountUp
            value={recoveredCents}
            duration={1.8}
            format={(n) => formatMoney(n)}
          />
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span>
          <span className="font-medium text-foreground">{invoiceCount}</span> invoices handled
        </span>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <span>
          <span className="font-medium text-emerald-300">{hoursSaved.toFixed(1)}h</span> of human chasing saved
        </span>
        <span className="hidden h-3 w-px bg-white/10 sm:block" />
        <span>DSO <span className="font-medium text-foreground">−32 days</span> on collected accounts</span>
      </div>
    </section>
  );
}
