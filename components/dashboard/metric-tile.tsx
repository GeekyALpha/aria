"use client";

import type { LucideIcon } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";
import { cn } from "@/lib/utils";

interface MetricTileProps {
  icon: LucideIcon;
  label: string;
  value: number;
  format?: (n: number) => string;
  accent?: "emerald" | "coral" | "blue" | "amber";
  delta?: string;
}

const ACCENT: Record<NonNullable<MetricTileProps["accent"]>, string> = {
  emerald: "text-emerald-300 bg-emerald-400/10 ring-emerald-400/20",
  coral: "text-[#ff7a86] bg-[rgba(255,82,99,0.10)] ring-[rgba(255,82,99,0.25)]",
  blue: "text-sky-300 bg-sky-400/10 ring-sky-400/20",
  amber: "text-amber-300 bg-amber-400/10 ring-amber-400/20",
};

export function MetricTile({
  icon: Icon,
  label,
  value,
  format,
  accent = "emerald",
  delta,
}: MetricTileProps) {
  return (
    <div className="glass group relative overflow-hidden rounded-2xl p-4 transition-transform duration-300 hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <div className={cn("inline-flex h-9 w-9 items-center justify-center rounded-xl ring-1", ACCENT[accent])}>
          <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
        </div>
        {delta && (
          <span className="text-[11px] font-medium text-muted-foreground">{delta}</span>
        )}
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-foreground tabular">
        <CountUp value={value} format={format} />
      </div>
      <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
