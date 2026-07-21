import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/db";
import { reconcilePayment } from "@/lib/reconcile";
import { formatMoney } from "@/lib/utils";
import type { Invoice } from "@/lib/types";
import { PayActions } from "@/components/pay/pay-actions";

const PAY_BASE = process.env.NEXT_PUBLIC_PINCH_PAY_BASE ?? "https://pay.getpinch.com.au";

export const dynamic = "force-dynamic";

export default async function PayPage(props: PageProps<"/pay/[linkId]">) {
  const { linkId } = await props.params;
  const sp = await props.searchParams;
  const justPaid = !!((sp as Record<string, unknown>)?.paymentId || (sp as Record<string, unknown>)?.paid);

  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("payment_link_id", linkId)
    .maybeSingle();

  const invoice = data as Invoice | null;

  // If Pinch redirected back with a paymentId, reconcile (idempotent) for instant UI feedback.
  if (invoice && justPaid) {
    const paymentId = String((sp as Record<string, unknown>)?.paymentId ?? `plk_${linkId}`);
    await reconcilePayment(invoice.id, { paymentId });
  }

  if (!invoice) {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-lg font-semibold">Payment link not found</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            This link is invalid or has expired.
          </p>
          <Link href="/" className="mt-4 inline-block text-sm text-emerald-300 hover:underline">
            Return to Aria
          </Link>
        </div>
      </div>
    );
  }

  const instalment1 = Math.ceil(invoice.amount_cents * 0.34);
  const hostedUrl = `${PAY_BASE}/pay/${linkId}`;

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center p-6">
      <div className="pointer-events-none fixed inset-0 grid-bg opacity-40" />
      <div className="relative w-full max-w-md">
        <div className="mb-5 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Aria
          </Link>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Lock className="h-3 w-3" /> Secured by Pinch
          </span>
        </div>

        <div className="glass-strong rounded-3xl p-7">
          {justPaid ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              <h1 className="mt-4 text-2xl font-semibold text-gradient-emerald tabular">
                {formatMoney(invoice.amount_cents)}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Payment received · reconciled automatically
              </p>
              <Link
                href={`/invoices/${invoice.id}`}
                className="mt-6 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-[#052e22] hover:bg-emerald-400"
              >
                View invoice
              </Link>
            </div>
          ) : (
            <>
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Instalment 1 of 3
              </div>
              <div className="mt-2 text-[40px] font-semibold leading-none tracking-tight text-foreground tabular">
                {formatMoney(instalment1)}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {invoice.debtor_name}
                {invoice.xero_ref ? ` · ${invoice.xero_ref}` : ""}
              </div>

              <div className="mt-5 space-y-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Plan total</span>
                  <span className="text-foreground tabular">{formatMoney(invoice.amount_cents)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Remaining after this</span>
                  <span className="text-foreground tabular">
                    {formatMoney(invoice.amount_cents - instalment1)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Next instalments</span>
                  <span className="text-foreground">+14d · +28d</span>
                </div>
              </div>

              <PayActions hostedUrl={hostedUrl} invoiceId={invoice.id} linkId={linkId} />

              <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400/70" />
                Test card: 4242 4242 4242 4242 · any future date / CVC
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
