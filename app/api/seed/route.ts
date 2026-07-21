import { ensureSeed } from "@/seed/debtors";

export async function POST() {
  const invoices = await ensureSeed();
  return Response.json({ seeded: invoices.length, invoices });
}

export async function GET() {
  const invoices = await ensureSeed();
  return Response.json({ seeded: invoices.length, invoices });
}
