import { createInvoice } from "@/lib/db";
import { dollarsToCents } from "@/lib/utils";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: "invalid json" }, { status: 400 });

  const amount_cents =
    typeof body.amount_cents === "number"
      ? body.amount_cents
      : dollarsToCents(Number(body.amount ?? 0));

  if (!body.debtor_name || !body.debtor_email || !amount_cents || !body.due_date) {
    return Response.json(
      { error: "required: debtor_name, debtor_email, amount (or amount_cents), due_date" },
      { status: 400 },
    );
  }

  const invoice = await createInvoice({
    debtor_name: String(body.debtor_name),
    debtor_email: String(body.debtor_email),
    amount_cents,
    due_date: String(body.due_date),
    xero_ref: body.xero_ref ? String(body.xero_ref) : null,
    debtor_history: body.debtor_history as Record<string, unknown> | undefined,
  });

  return Response.json({ invoice });
}
