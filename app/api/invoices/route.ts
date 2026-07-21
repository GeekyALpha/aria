import { listInvoices } from "@/lib/db";

export async function GET() {
  const invoices = await listInvoices();
  return Response.json({ invoices });
}
