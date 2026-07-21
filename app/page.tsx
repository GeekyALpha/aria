import { Database, Receipt } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { HeroCounter } from "@/components/dashboard/hero-counter";
import { MetricsGrid } from "@/components/dashboard/metrics-grid";
import { InvoiceCard } from "@/components/dashboard/invoice-card";
import { AutoRefresh } from "@/components/dashboard/auto-refresh";
import { getMetrics, listInvoices } from "@/lib/db";
import { ensureSeed } from "@/seed/debtors";
import type { Invoice, InvoiceStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_ORDER: Record<InvoiceStatus, number> = {
  overdue: 0,
  negotiating: 1,
  in_plan: 2,
  disputed: 3,
  uncollectable: 4,
  paid: 5,
};

export default async function Page() {
  let invoices: Invoice[] = [];
  let recoveredCents = 0;
  let outstandingCents = 0;
  let overdueCount = 0;
  let paidCount = 0;
  let hoursSaved = 0;
  let dbReady = true;
  let reason = "";

  try {
    let metrics = await getMetrics();
    invoices = await listInvoices();

    if (invoices.length === 0) {
      await ensureSeed();
      invoices = await listInvoices();
      metrics = await getMetrics();
    }

    recoveredCents = metrics.recovered_cents ?? 0;
    outstandingCents = metrics.outstanding_cents ?? 0;
    overdueCount = metrics.overdue_count ?? 0;
    paidCount = metrics.paid_count ?? 0;
    hoursSaved = Number(metrics.hours_saved ?? 0);
  } catch (e) {
    dbReady = false;
    reason = (e as Error).message;
  }

  if (!dbReady) {
    return (
      <AppShell>
        <div className="glass mt-10 rounded-2xl p-10 text-center">
          <Database className="mx-auto h-8 w-8 text-amber-300" />
          <h2 className="mt-4 text-lg font-semibold">Supabase not connected yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Provision the database (Supabase MCP) and set <code className="rounded bg-white/10 px-1">SUPABASE_URL</code> +{" "}
            <code className="rounded bg-white/10 px-1">SUPABASE_SERVICE_ROLE_KEY</code> in{" "}
            <code className="rounded bg-white/10 px-1">.env.local</code>, then refresh.
          </p>
          <p className="mx-auto mt-3 max-w-md text-xs text-muted-foreground/70">{reason}</p>
        </div>
      </AppShell>
    );
  }

  const sorted = [...invoices].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9),
  );

  return (
    <AppShell>
      <AutoRefresh />

      <HeroCounter
        recoveredCents={recoveredCents}
        invoiceCount={invoices.length}
        hoursSaved={hoursSaved}
      />

      <MetricsGrid
        overdueCount={overdueCount}
        outstandingCents={outstandingCents}
        recoveredCents={recoveredCents}
        hoursSaved={hoursSaved}
      />

      <div className="mt-8 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-medium uppercase tracking-[0.16em] text-muted-foreground">
          <Receipt className="h-4 w-4" />
          Work queue
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-muted-foreground">
            {invoices.length}
          </span>
        </h2>
        <span className="text-xs text-muted-foreground">{paidCount} collected</span>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((inv, i) => (
          <InvoiceCard key={inv.id} invoice={inv} index={i} />
        ))}
      </div>
    </AppShell>
  );
}
