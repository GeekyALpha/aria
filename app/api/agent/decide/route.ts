import { decideAction } from "@/lib/agent/openai";
import { addMessage, getInvoice, listConversations, recordAction, updateInvoice } from "@/lib/db";
import type { DecideInput } from "@/lib/agent/prompt";
import { daysSince } from "@/lib/utils";

export async function POST(req: Request) {
  const { invoice_id } = (await req.json().catch(() => ({}))) as { invoice_id?: string };
  if (!invoice_id) return Response.json({ error: "invoice_id required" }, { status: 400 });

  const invoice = await getInvoice(invoice_id);
  const thread = (await listConversations(invoice_id)).map((c) => ({
    role: c.role,
    content: c.content,
  }));

  const input: DecideInput = {
    invoice: {
      debtor_name: invoice.debtor_name,
      debtor_email: invoice.debtor_email,
      amount_cents: invoice.amount_cents,
      currency: invoice.currency,
      due_date: invoice.due_date,
      status: invoice.status,
      days_overdue: daysSince(invoice.due_date),
      xero_ref: invoice.xero_ref,
    },
    history: {
      prior_invoices_paid: invoice.debtor_history.prior_invoices_paid ?? 0,
      prior_invoices_late: invoice.debtor_history.prior_invoices_late ?? 0,
      average_days_late: invoice.debtor_history.average_days_late ?? 0,
      first_time_debtor: invoice.debtor_history.first_time_debtor,
      segment: invoice.debtor_history.segment,
      notes: invoice.debtor_history.notes,
    },
    thread,
  };

  const { action, model, fallback } = await decideAction(input);

  await addMessage({
    invoice_id,
    role: "agent",
    channel: action.channel,
    content: action.message_body,
    reasoning: action.reasoning,
  });

  await recordAction({
    invoice_id,
    type: `decide:${action.action}`,
    payload: { ...action, model, fallback },
  });

  await updateInvoice(invoice_id, { status: "negotiating" });

  return Response.json({ action, model, fallback, invoice_id });
}
