import "server-only";
import { supabase } from "@/lib/db";
import type { Invoice } from "@/lib/types";

function daysAgoIso(days: number): string {
  const d = new Date(Date.now() - days * 86_400_000);
  return d.toISOString().slice(0, 10);
}

export const DEMO_INVOICES = [
  {
    id: "a1a1a1a1-0001-4aaa-8aaa-000000000001",
    debtor_name: "Maple & Co Architects",
    debtor_email: "accounts@mapleco.com.au",
    amount_cents: 480_000,
    due_date: daysAgoIso(14),
    xero_ref: "INV-2048",
    debtor_history: {
      prior_invoices_paid: 11,
      prior_invoices_late: 0,
      average_days_late: 0,
      first_time_late: true,
      first_time_debtor: false,
      segment: "reliable",
      notes: "Long-standing client, spotless payment record. First time ever late.",
    },
  },
  {
    id: "a1a1a1a1-0001-4aaa-8aaa-000000000002",
    debtor_name: "Riverside Café Group",
    debtor_email: "jordan@riversidecafe.com.au",
    amount_cents: 125_000,
    due_date: daysAgoIso(9),
    xero_ref: "INV-2051",
    debtor_history: {
      prior_invoices_paid: 6,
      prior_invoices_late: 5,
      average_days_late: 8,
      first_time_late: false,
      first_time_debtor: false,
      segment: "chronic",
      notes: "Habitually a week+ late. Cash-flow-juggling hospitality operator.",
    },
  },
  {
    id: "a1a1a1a1-0001-4aaa-8aaa-000000000003",
    debtor_name: "Harbour Logistics Pty Ltd",
    debtor_email: "ap@harbourlogistics.com.au",
    amount_cents: 1_240_000,
    due_date: daysAgoIso(31),
    xero_ref: "INV-2039",
    debtor_history: {
      prior_invoices_paid: 18,
      prior_invoices_late: 2,
      average_days_late: 4,
      first_time_late: false,
      first_time_debtor: false,
      segment: "occasionally_late",
      notes: "Large balance, a month overdue. Usually pays on the second nudge.",
    },
  },
] as const;

export async function ensureSeed(): Promise<Invoice[]> {
  const rows = DEMO_INVOICES.map((d) => ({
    ...d,
    status: "overdue" as const,
    debtor_history: { ...d.debtor_history },
  }));

  const { data, error } = await supabase
    .from("invoices")
    .upsert(rows, { onConflict: "id" })
    .select("*");

  if (error) {
    throw new Error(`ensureSeed failed: ${error.message}`);
  }
  return (data ?? []) as Invoice[];
}
