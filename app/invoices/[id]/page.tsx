import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/shell/app-shell";
import { InvoiceWorkspace } from "@/components/invoice/invoice-workspace";
import { getInvoice, listActions, listConversations } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage(props: PageProps<"/invoices/[id]">) {
  const { id } = await props.params;

  let invoice;
  try {
    invoice = await getInvoice(id);
  } catch {
    notFound();
  }

  const [conversations, actions] = await Promise.all([
    listConversations(id),
    listActions(id),
  ]);

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
