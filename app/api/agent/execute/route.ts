import {
  addBankSource,
  createPaymentLink,
  createSubscription,
  ensurePayInThreePlan,
  createPayer,
  isPinchConfigured,
  splitName,
} from "@/lib/pinch/client";
import { getInvoice, recordAction, updateInvoice } from "@/lib/db";

export async function POST(req: Request) {
  const { invoice_id } = (await req.json().catch(() => ({}))) as { invoice_id?: string };
  if (!invoice_id) return Response.json({ error: "invoice_id required" }, { status: 400 });
  if (!isPinchConfigured()) {
    return Response.json(
      { error: "Pinch not configured — set PINCH_CLIENT_ID and PINCH_SECRET_KEY" },
      { status: 503 },
    );
  }

  const invoice = await getInvoice(invoice_id);
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (host?.startsWith("localhost") ? "http" : "https");
  const appUrl = host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000");

  // 1. Ensure a Payer exists for this debtor.
  let payerId = invoice.payer_id;
  if (!payerId) {
    const { firstName, lastName } = splitName(invoice.debtor_name);
    const payer = await createPayer({
      firstName,
      lastName,
      emailAddress: invoice.debtor_email,
      companyName: invoice.debtor_name,
    });
    payerId = payer.id;
    await updateInvoice(invoice_id, { payer_id: payerId });
  }

  // 2. Attach a bank source so the scheduled instalments have a rail (best-effort).
  try {
    await addBankSource(payerId!, {
      bankAccountName: invoice.debtor_name,
      bankAccountBsb: "012-001",
      bankAccountNumber: "987654321",
    });
  } catch {
    /* non-fatal: realtime card collect still works without a bank source */
  }

  // 3. Ensure the reusable percentage Pay-in-3 plan exists (requiresTotalAmount=true).
  const plan = await ensurePayInThreePlan();

  // 4. Subscribe the debtor with the invoice total → 3 scheduled instalments (best-effort).
  let subscriptionId: string | null = null;
  try {
    const subscription = await createSubscription({
      planId: plan.id,
      payerId: payerId!,
      totalAmount: invoice.amount_cents,
      surcharge: ["bank-account", "credit-card"],
    });
    subscriptionId = subscription.id;
  } catch {
    /* non-fatal */
  }

  // 5. Payment Link for instalment 1 — paid live via realtime card (the "wow").
  const instalment1 = Math.ceil(invoice.amount_cents * 0.34);
  const link = await createPaymentLink({
    amount: instalment1,
    payerId: payerId!,
    description: `Aria · Instalment 1 of 3 — ${invoice.debtor_name}${
      invoice.xero_ref ? ` (${invoice.xero_ref})` : ""
    }`,
    allowedPaymentMethods: ["credit-card", "bank-account"],
    surchargePaymentMethods: ["credit-card", "bank-account"],
    returnUrl: `${appUrl}/invoices/${invoice_id}`,
  });

  const updated = await updateInvoice(invoice_id, {
    payer_id: payerId,
    plan_id: plan.id,
    subscription_id: subscriptionId,
    payment_link_id: link.id,
    status: "in_plan",
  });

  await recordAction({
    invoice_id,
    type: "execute_pay_in_3",
    payload: {
      plan_id: plan.id,
      subscription_id: subscriptionId,
      payment_link_id: link.id,
      payment_link_url: link.url,
      instalment1_cents: instalment1,
      total_cents: invoice.amount_cents,
    },
    plan_id: plan.id,
    payment_link_id: link.id,
  });

  return Response.json({
    invoice: updated,
    plan_id: plan.id,
    subscription_id: subscriptionId,
    payment_link_id: link.id,
    payment_link_url: link.url,
    instalment1_cents: instalment1,
    total_cents: invoice.amount_cents,
  });
}
