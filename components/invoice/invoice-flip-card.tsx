"use client";

import { motion } from "framer-motion";
import { Building2, Check, Clock, FileText } from "lucide-react";
import type { Invoice } from "@/lib/types";
import { statusMeta } from "@/lib/status";
import { cn, daysSince, formatMoney } from "@/lib/utils";

export function InvoiceFlipCard({
  invoice,
  paid,
}: {
  invoice: Invoice;
  paid: boolean;
}) {
  const meta = statusMeta(paid ? "paid" : invoice.status);
  const overdue = daysSince(invoice.due_date);

  return (
    <div className="[perspective:1600px]">
      <motion.div
        className="relative h-[252px] w-full [transform-style:preserve-3d]"
        animate={{ rotateY: paid ? 180 : 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Front */}
        <div className="glass absolute inset-0 flex flex-col justify-between rounded-2xl p-6 [backface-visibility:hidden]">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-xs uppercase tracking-wide">
                {invoice.xero_ref ?? "Invoice"}
              </span>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
                meta.bg,
                meta.border,
                meta.text,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
              {meta.label}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              {invoice.debtor_name}
            </div>
            <div className="mt-2 text-[44px] font-semibold leading-none tracking-tight text-foreground tabular">
              {formatMoney(invoice.amount_cents)}
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {invoice.status === "paid"
                ? "Reconciled"
                : `${overdue} day${overdue === 1 ? "" : "s"} overdue · due ${invoice.due_date}`}
            </div>
          </div>
        </div>

        {/* Back (Paid) */}
        <div className="glass glow-emerald absolute inset-0 flex flex-col items-center justify-center rounded-2xl p-6 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <motion.div
            initial={false}
            animate={paid ? { scale: [0.6, 1.15, 1], opacity: [0, 1] } : {}}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-[#052e22]"
          >
            <Check className="h-9 w-9" strokeWidth={3} />
          </motion.div>
          <div className="mt-4 text-[34px] font-semibold tracking-tight text-gradient-emerald tabular">
            {formatMoney(invoice.amount_cents)}
          </div>
          <div className="mt-1 text-sm font-medium text-emerald-300">Collected &amp; reconciled</div>
          <div className="mt-1 text-xs text-muted-foreground">
            via Pinch Transfers · settled to merchant account
          </div>
        </div>
      </motion.div>
    </div>
  );
}
