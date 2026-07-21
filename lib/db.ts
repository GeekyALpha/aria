import "server-only";
import { createClient } from "@supabase/supabase-js";
import type {
  ActionRecord,
  Conversation,
  ConversationRole,
  DashboardMetrics,
  Invoice,
  NewInvoiceInput,
} from "./types";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SUPABASE_CONFIGURED = !!(url && serviceKey);
if (!SUPABASE_CONFIGURED) {
  console.warn(
    "[db] SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — DB calls will fail until provisioned.",
  );
}

// Construct with placeholders when unconfigured so module load never throws;
// real calls are short-circuited by ensureConfigured() below.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  serviceKey || "placeholder-service-key",
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const T = {
  invoices: "invoices",
  conversations: "conversations",
  actions: "actions",
} as const;

export class DbError extends Error {
  constructor(
    message: string,
    readonly code?: string,
  ) {
    super(message);
  }
}

function ensureConfigured(op: string) {
  if (!SUPABASE_CONFIGURED) {
    throw new DbError(
      `${op}: Supabase not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY`,
    );
  }
}

function assertNoError(err: { message: string; code?: string } | null, op: string) {
  if (err) throw new DbError(`${op}: ${err.message}`, err.code ?? undefined);
}

// ── Invoices ───────────────────────────────────────────────
export async function listInvoices(): Promise<Invoice[]> {
  ensureConfigured("listInvoices");
  const { data, error } = await supabase
    .from(T.invoices)
    .select("*")
    .order("created_at", { ascending: false });
  assertNoError(error, "listInvoices");
  return (data ?? []) as Invoice[];
}

export async function getInvoice(id: string): Promise<Invoice> {
  ensureConfigured("getInvoice");
  const { data, error } = await supabase.from(T.invoices).select("*").eq("id", id).single();
  assertNoError(error, "getInvoice");
  return data as Invoice;
}

export async function createInvoice(input: NewInvoiceInput): Promise<Invoice> {
  ensureConfigured("createInvoice");
  const { data, error } = await supabase
    .from(T.invoices)
    .insert({
      debtor_name: input.debtor_name,
      debtor_email: input.debtor_email,
      amount_cents: input.amount_cents,
      due_date: input.due_date,
      xero_ref: input.xero_ref ?? null,
      debtor_history: input.debtor_history ?? {},
    })
    .select("*")
    .single();
  assertNoError(error, "createInvoice");
  return data as Invoice;
}

export async function updateInvoice(
  id: string,
  patch: Partial<Invoice>,
): Promise<Invoice> {
  ensureConfigured("updateInvoice");
  const { data, error } = await supabase
    .from(T.invoices)
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  assertNoError(error, "updateInvoice");
  return data as Invoice;
}

// ── Conversations ──────────────────────────────────────────
export async function listConversations(invoiceId: string): Promise<Conversation[]> {
  ensureConfigured("listConversations");
  const { data, error } = await supabase
    .from(T.conversations)
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: true });
  assertNoError(error, "listConversations");
  return (data ?? []) as Conversation[];
}

export async function addMessage(input: {
  invoice_id: string;
  role: ConversationRole;
  channel?: string;
  content: string;
  reasoning?: string | null;
}): Promise<Conversation> {
  ensureConfigured("addMessage");
  const { data, error } = await supabase
    .from(T.conversations)
    .insert({
      invoice_id: input.invoice_id,
      role: input.role,
      channel: input.channel ?? "email",
      content: input.content,
      reasoning: input.reasoning ?? null,
    })
    .select("*")
    .single();
  assertNoError(error, "addMessage");
  return data as Conversation;
}

// ── Actions ────────────────────────────────────────────────
export async function recordAction(input: {
  invoice_id: string;
  type: string;
  payload?: Record<string, unknown>;
  plan_id?: string | null;
  payment_link_id?: string | null;
  status?: string;
}): Promise<ActionRecord> {
  ensureConfigured("recordAction");
  const { data, error } = await supabase
    .from(T.actions)
    .insert({
      invoice_id: input.invoice_id,
      type: input.type,
      payload: input.payload ?? {},
      plan_id: input.plan_id ?? null,
      payment_link_id: input.payment_link_id ?? null,
      status: input.status ?? "executed",
    })
    .select("*")
    .single();
  assertNoError(error, "recordAction");
  return data as ActionRecord;
}

export async function listActions(invoiceId: string): Promise<ActionRecord[]> {
  ensureConfigured("listActions");
  const { data, error } = await supabase
    .from(T.actions)
    .select("*")
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: true });
  assertNoError(error, "listActions");
  return (data ?? []) as ActionRecord[];
}

// ── Metrics ────────────────────────────────────────────────
export async function getMetrics(): Promise<DashboardMetrics> {
  ensureConfigured("getMetrics");
  const { data, error } = await supabase.from("dashboard_metrics").select("*").single();
  assertNoError(error, "getMetrics");
  return data as DashboardMetrics;
}
