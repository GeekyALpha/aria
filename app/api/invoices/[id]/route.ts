import { getInvoice, listActions, listConversations } from "@/lib/db";

export async function GET(_req: Request, ctx: RouteContext<"/api/invoices/[id]">) {
  const { id } = await ctx.params;
  try {
    const [invoice, conversations, actions] = await Promise.all([
      getInvoice(id),
      listConversations(id),
      listActions(id),
    ]);
    return Response.json({ invoice, conversations, actions });
  } catch (e) {
    return Response.json({ error: (e as Error).message }, { status: 404 });
  }
}
