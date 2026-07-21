"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function defaultDue(): string {
  return new Date(Date.now() - 14 * 86_400_000).toISOString().slice(0, 10);
}

export function NewInvoiceDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const payload = {
      debtor_name: String(form.get("debtor_name") ?? ""),
      debtor_email: String(form.get("debtor_email") ?? ""),
      amount: Number(form.get("amount") ?? 0),
      due_date: String(form.get("due_date") ?? ""),
      xero_ref: String(form.get("xero_ref") ?? "") || undefined,
    };
    if (!payload.debtor_name || !payload.debtor_email || !payload.amount || !payload.due_date) {
      toast.error("Fill in debtor, email, amount and due date.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      toast.success(`Invoice to ${payload.debtor_name} added.`);
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 bg-emerald-500 text-[#052e22] hover:bg-emerald-400">
          <Plus className="h-4 w-4" /> New invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-strong border-white/10 bg-[#0f1623]/95">
        <DialogHeader>
          <DialogTitle>Paste an overdue invoice</DialogTitle>
          <DialogDescription>
            Aria will read it, decide a recovery action, and act on Pinch rails.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-3 py-1">
          <div className="grid gap-1.5">
            <Label htmlFor="debtor_name">Debtor / business</Label>
            <Input id="debtor_name" name="debtor_name" placeholder="Maple & Co Architects" required />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="debtor_email">Email</Label>
            <Input id="debtor_email" name="debtor_email" type="email" placeholder="accounts@…com.au" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label htmlFor="amount">Amount (AUD)</Label>
              <Input id="amount" name="amount" type="number" min="1" step="0.01" placeholder="4800" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="due_date">Due date</Label>
              <Input id="due_date" name="due_date" type="date" defaultValue={defaultDue()} required />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="xero_ref">Reference (optional)</Label>
            <Input id="xero_ref" name="xero_ref" placeholder="INV-2048" />
          </div>
          <DialogFooter className="pt-2">
            <Button type="submit" disabled={loading} className="gap-1.5 bg-emerald-500 text-[#052e22] hover:bg-emerald-400">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Add &amp; hand to Aria
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
