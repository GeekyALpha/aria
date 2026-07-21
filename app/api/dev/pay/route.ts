import { reconcilePayment } from "@/lib/reconcile";

/**
 * Dev-only: simulate a successful Pinch payment for rehearsal when the live
 * webhook hasn't arrived (idea.md §15 — pre-stage reconciled state). No-op in
 * production builds is acceptable; this is a demo control surface.
 */
export async function POST(req: Request) {
  const { invoice_id } = (await req.json().catch(() => ({}))) as { invoice_id?: string };
  if (!invoice_id) return Response.json({ error: "invoice_id required" }, { status: 400 });

  const invoice = await reconcilePayment(invoice_id, {
    paymentId: `demo_${Date.now()}`,
  });

  return Response.json({ ok: true, invoice, simulated: true });
}
