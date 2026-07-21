"use client";

import { CircleDollarSign, Clock, Hourglass, TrendingUp } from "lucide-react";
import { MetricTile } from "./metric-tile";
import { formatMoney } from "@/lib/utils";

interface MetricsGridProps {
  overdueCount: number;
  outstandingCents: number;
  recoveredCents: number;
  hoursSaved: number;
}

export function MetricsGrid({
  overdueCount,
  outstandingCents,
  recoveredCents,
  hoursSaved,
}: MetricsGridProps) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <MetricTile
        icon={Clock}
        label="Overdue invoices"
        value={overdueCount}
        accent="coral"
        delta="needs attention"
      />
      <MetricTile
        icon={CircleDollarSign}
        label="Outstanding"
        value={outstandingCents}
        format={formatMoney}
        accent="amber"
      />
      <MetricTile
        icon={TrendingUp}
        label="Recovered"
        value={recoveredCents}
        format={formatMoney}
        accent="emerald"
        delta="this cycle"
      />
      <MetricTile
        icon={Hourglass}
        label="Human hours saved"
        value={hoursSaved}
        format={(n) => `${n.toFixed(1)}h`}
        accent="blue"
      />
    </div>
  );
}
