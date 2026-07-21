"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, ExternalLink, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

export function PayActions({
  hostedUrl,
  invoiceId,
  linkId,
}: {
  hostedUrl: string;
  invoiceId: string;
  linkId: string;
}) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function simulate() {
    setBusy(true);
    try {
      const res = await fetch("/api/dev/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoiceId }),
      });
      if (!res.ok) throw new Error("Simulate failed");
      toast.success("Payment reconciled.");
      router.replace(`/pay/${linkId}?paid=1`);
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="mt-5 space-y-2">
      <a
        href={hostedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-[#052e22] transition-colors hover:bg-emerald-400"
      >
        <CreditCard className="h-4 w-4" /> Pay securely on Pinch
        <ExternalLink className="h-3.5 w-3.5 opacity-70" />
      </a>
      <button
        onClick={simulate}
        disabled={busy}
        className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs text-muted-foreground transition-colors hover:bg-white/5"
      >
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
        Simulate instant payment (rehearsal)
      </button>
    </div>
  );
}
