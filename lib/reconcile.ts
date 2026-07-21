import "server-only";
import { addMessage, getInvoice, recordAction, supabase, updateInvoice } from "./db";

function getField(
  data: Record<string, unknown> | undefined,
  ...keys: string[]
): string | undefined {
  if (!data) return undefined;
  for (const k of Object.keys(data)) {
    if (keys.some((key) => key.toLowerCase() === k.toLowerCase())) {
      const v = (data as Record<string, unknown>)[k];
      if (typeof v === "string" && v) return v;
      if (v && typeof v === "object") {
        const id = (v as Record<string, unknown>).id;
        if (typeof id === "string") return id;
      }
    }
  }
  return undefined;
}

export async function findInvoiceForEvent(data?: Record<string, unknown>) {
  const ids = [
    getField(data, "payerId", "PayerId", "payer"),
    getField(data, "paymentLinkId", "PaymentLinkId"),
    getField(data, "paymentId", "PaymentId"),
    getField(data, "subscriptionId", "SubscriptionId"),
    getField(data, "id", "Id"),
  ].filter((x): x is string => !!x);

  for (const val of ids) {
    const { data: row } = await supabase
      .from("invoices")
      .select("*")
      .or(
        `payer_id.eq.${val},payment_link_id.eq.${val},pinch_payment_id.eq.${val},subscription_id.eq.${val}`,
      )
      .limit(1)
      .maybeSingle();
    if (row) return row;
  }
  return null;
}

export function isPaymentSuccess(
  type: string,
  data?: Record<string, unknown>,
): boolean {
  const t = type.toLowerCase();
  if (t === "realtime-payment" || t === "scheduled-process") {
    const status = getField(data, "status", "Status");
    return !status || /approved|processed|successful|paid|complete/.test(status.toLowerCase());
  }
  if (t === "payment-created" || t === "subscription-complete") return true;
  return false;
}

export async function reconcilePayment(
  invoiceId: string,
  opts: { paymentId?: string; amountCents?: number } = {},
) {
  const inv = await getInvoice(invoiceId);
  const recovered = opts.amountCents ?? inv.amount_cents;

  const updated = await updateInvoice(invoiceId, {
    status: "paid",
    pinch_payment_id: opts.paymentId ?? inv.pinch_payment_id ?? null,
    recovered_cents: recovered,
    hours_saved: 4.5,
  });

  await recordAction({
    invoice_id: invoiceId,
    type: "payment_reconciled",
    payload: { paymentId: opts.paymentId ?? null, recoveredCents: recovered },
  });

  await addMessage({
    invoice_id: invoiceId,
    role: "system",
    channel: "internal",
    content: `Reconciled — ${opts.paymentId ?? "settlement"} moved ${recovered}¢ to the merchant account via Pinch Transfers.`,
  });

  return updated;
}
