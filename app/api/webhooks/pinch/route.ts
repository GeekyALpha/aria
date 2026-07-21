import { getWebhookSecret, verifyPinchSignature } from "@/lib/pinch/webhook";
import { findInvoiceForEvent, isPaymentSuccess, reconcilePayment } from "@/lib/reconcile";
import { recordAction } from "@/lib/db";
import type { PinchWebhookEvent } from "@/lib/pinch/types";

export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("pinch-signature");

  let secret: string;
  try {
    secret = getWebhookSecret();
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 500 });
  }

  const verified = verifyPinchSignature(raw, sig, secret);
  if (!verified.ok) {
    return Response.json({ error: `signature rejected: ${verified.reason}` }, { status: 400 });
  }

  const event = JSON.parse(raw) as PinchWebhookEvent;
  const type = (event.Type ?? event.type ?? "").toLowerCase();
  const data = (event.Data ?? {}) as Record<string, unknown>;

  const invoice = await findInvoiceForEvent(data);

  if (invoice && isPaymentSuccess(type, data)) {
    const paymentId =
      (data.id as string) ??
      (data.Id as string) ??
      (data.paymentId as string) ??
      undefined;
    await reconcilePayment(invoice.id, { paymentId });
  } else {
    await recordAction({
      invoice_id: invoice?.id ?? "00000000-0000-0000-0000-000000000000",
      type: `webhook:${type || "unknown"}`,
      payload: { event, matchedInvoiceId: invoice?.id ?? null },
    });
  }

  return Response.json({ received: true, type, matched: !!invoice });
}
