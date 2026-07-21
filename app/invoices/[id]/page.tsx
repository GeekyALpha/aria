import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { InvoiceWorkspace } from "@/components/invoice/invoice-workspace";
import { getInvoice, listActions, listConversations } from "@/lib/db";
import { getPayment } from "@/lib/pinch/client";
import { reconcilePayment } from "@/lib/reconcile";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage(props: PageProps<"/invoices/[id]">) {
  const { id } = await props.params;

  let invoice = await getInvoice(id).catch(() => null);
  if (!invoice) notFound();

  // Pinch redirects back here with ?paymentId=… after a card payment. Verify it
  // against Pinch and reconcile immediately so the page shows Paid on return — the
  // signed webhook stays the authoritative path; this just removes the wait.
  const sp = await props.searchParams;
  const paymentId = (sp as Record<string, unknown> | undefined)?.paymentId;
  if (typeof paymentId === "string" && paymentId && invoice.status !== "paid") {
    try {
      const payment = await getPayment(paymentId);
      if (/approved|processed|successful|paid|complete/i.test(payment.status ?? "")) {
        await reconcilePayment(id, { paymentId });
      }
    } catch {
      // verification failed or Pinch not configured — the webhook will reconcile
    }
  }

  const [fresh, conversations, actions] = await Promise.all([
    getInvoice(id),
    listConversations(id),
    listActions(id),
  ]);
  invoice = fresh;

  return (
    <AppShell>
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="mb-5">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {invoice.debtor_name}
        </h1>
        <p className="text-sm text-muted-foreground">
          {invoice.xero_ref ?? "Invoice"} · {invoice.debtor_email}
        </p>
      </div>

      <InvoiceWorkspace
        invoice={invoice}
        conversations={conversations}
        actions={actions}
      />
    </AppShell>
  );
}
