"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import type { Invoice } from "@/lib/types";
import { statusMeta } from "@/lib/status";
import { cn, daysSince, formatMoney } from "@/lib/utils";

const SEGMENT_LABEL: Record<string, string> = {
  reliable: "Reliable payer",
  occasionally_late: "Occasionally late",
  chronic: "Chronic late-payer",
  new: "New debtor",
};

export function InvoiceCard({ invoice, index = 0 }: { invoice: Invoice; index?: number }) {
  const meta = statusMeta(invoice.status);
  const overdueDays = daysSince(invoice.due_date);
  const segment =
    SEGMENT_LABEL[invoice.debtor_history.segment ?? ""] ?? "Debtor";

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/invoices/${invoice.id}`}
        className={cn(
          "glass group relative block overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:border-white/15 hover:bg-white/[0.06]",
          invoice.status === "paid" && "glow-emerald",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-[15px] font-medium text-foreground">
              {invoice.debtor_name}
            </div>
            <div className="mt-0.5 truncate text-xs text-muted-foreground">
              {invoice.xero_ref ?? invoice.debtor_email}
            </div>
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
              meta.bg,
              meta.border,
              meta.text,
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
            {meta.label}
          </span>
        </div>

        <div className="mt-4 flex items-end justify-between">
          <div>
            <div className="text-[26px] font-semibold leading-none tracking-tight text-foreground tabular">
              {formatMoney(invoice.amount_cents)}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {invoice.status === "paid"
                ? "Recovered"
                : `${overdueDays} day${overdueDays === 1 ? "" : "s"} overdue`}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              {segment}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              Aria <ArrowRight className="h-3 w-3" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
