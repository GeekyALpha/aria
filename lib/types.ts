// Domain types mirroring the Supabase tables (see supabase/migrations/0001_init.sql).

export type InvoiceStatus =
  | "overdue"
  | "negotiating"
  | "in_plan"
  | "paid"
  | "disputed"
  | "uncollectable";

export interface DebtorHistory {
  prior_invoices_paid: number;
  prior_invoices_late: number;
  average_days_late: number;
  first_time_debtor?: boolean;
  first_time_late?: boolean;
  segment?: "reliable" | "occasionally_late" | "chronic" | "new";
  notes?: string;
}

export interface Invoice {
  id: string;
  debtor_name: string;
  debtor_email: string;
  amount_cents: number;
  currency: string;
  due_date: string;
  status: InvoiceStatus;
  xero_ref: string | null;
  payer_id: string | null;
  plan_id: string | null;
  subscription_id: string | null;
  payment_link_id: string | null;
  pinch_payment_id: string | null;
  debtor_history: DebtorHistory;
  recovered_cents: number;
  hours_saved: number;
  created_at: string;
  updated_at: string;
}

export type ConversationRole = "agent" | "debtor" | "system";
export type Channel = "email" | "sms" | "whatsapp" | "internal";

export interface Conversation {
  id: string;
  invoice_id: string;
  role: ConversationRole;
  channel: Channel;
  content: string;
  reasoning?: string | null;
  created_at: string;
}

export interface ActionRecord {
  id: string;
  invoice_id: string;
  type: string;
  payload: Record<string, unknown>;
  plan_id: string | null;
  payment_link_id: string | null;
  status: string;
  created_at: string;
}

export interface DashboardMetrics {
  total_invoices: number;
  overdue_count: number;
  paid_count: number;
  outstanding_cents: number;
  recovered_cents: number;
  hours_saved: number;
}

export interface NewInvoiceInput {
  debtor_name: string;
  debtor_email: string;
  amount_cents: number;
  due_date: string;
  xero_ref?: string | null;
  debtor_history?: Partial<DebtorHistory>;
}
