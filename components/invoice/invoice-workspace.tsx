"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity,
  BadgeCheck,
  Brain,
  CreditCard,
  Gauge,
  History,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import type { ActionRecord, Conversation, Invoice } from "@/lib/types";
import type { AgentAction } from "@/lib/agent/schemas";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThinkingStream } from "@/components/motion/thinking-stream";
import { InvoiceFlipCard } from "./invoice-flip-card";
import { DebtorInbox } from "./debtor-inbox";
import { fireConfetti } from "@/components/motion/confetti";
import { cn, formatMoney } from "@/lib/utils";

interface PlanState {
  payment_link_id: string;
  payment_link_url: string;
  instalment1_cents: number;
  total_cents: number;
}

const TONE: Record<string, string> = {
  warm: "bg-emerald-400/10 text-emerald-300 ring-emerald-400/20",
  firm: "bg-sky-400/10 text-sky-300 ring-sky-400/20",
  urgent: "bg-amber-400/10 text-amber-300 ring-amber-400/20",
  final_notice: "bg-[rgba(255,82,99,0.10)] text-[#ff7a86] ring-[rgba(255,82,99,0.25)]",
};

export function InvoiceWorkspace({
  invoice: initialInvoice,
  conversations,
  actions,
}: {
  invoice: Invoice;
  conversations: Conversation[];
  actions: ActionRecord[];
}) {
  const router = useRouter();
  const [invoice] = useState(initialInvoice);
  const [messages, setMessages] = useState<Conversation[]>(conversations);
  const [thinking, setThinking] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [action, setAction] = useState<AgentAction | null>(null);
  const [reasoningKey, setReasoningKey] = useState(0);
  const [plan, setPlan] = useState<PlanState | null>(null);
  const [paid, setPaid] = useState(initialInvoice.status === "paid");

  function pushAgentMessage(a: AgentAction) {
    const msg: Conversation = {
      id: crypto.randomUUID(),
      invoice_id: invoice.id,
      role: "agent",
      channel: a.channel,
      content: a.message_body,
      reasoning: a.reasoning,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, msg]);
  }

  async function runAria() {
    setThinking(true);
    setDeciding(true);
    try {
      const res = await fetch("/api/agent/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoice.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Aria failed to decide");
      setAction(data.action);
      setReasoningKey((k) => k + 1);
      pushAgentMessage(data.action);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setThinking(false);
      setDeciding(false);
    }
  }

  async function sendReply(text: string) {
    const debtorMsg: Conversation = {
      id: crypto.randomUUID(),
      invoice_id: invoice.id,
      role: "debtor",
      channel: "email",
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, debtorMsg]);
    setThinking(true);
    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoice.id, content: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Reply failed");
      setAction(data.action);
      setReasoningKey((k) => k + 1);
      pushAgentMessage(data.action);
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setThinking(false);
    }
  }

  async function setupPlan() {
    setExecuting(true);
    try {
      const res = await fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoice.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Execution failed");
      setPlan({
        payment_link_id: data.payment_link_id,
        payment_link_url: data.payment_link_url,
        instalment1_cents: data.instalment1_cents,
        total_cents: data.total_cents,
      });
      toast.success("Pay-in-3 plan created on Pinch rails.");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExecuting(false);
    }
  }

  async function simulatePayment() {
    try {
      const res = await fetch("/api/dev/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice_id: invoice.id }),
      });
      if (!res.ok) throw new Error("Simulate failed");
      setPaid(true);
      fireConfetti();
      toast.success("Payment reconciled.");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  const showPlanCta =
    action && (action.action === "offer_plan" || action.action === "send_payment_link");

  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <InvoiceFlipCard invoice={invoice} paid={paid} />

        {/* Reasoning */}
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Brain className="h-4 w-4 text-emerald-300" />
              Aria&apos;s reasoning
            </div>
            {action && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("gap-1 ring-1", TONE[action.tone] ?? "")}>
                  <Gauge className="h-3 w-3" /> {action.tone.replace("_", " ")}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Activity className="h-3 w-3" /> {(action.confidence * 100).toFixed(0)}%
                </Badge>
              </div>
            )}
          </div>

          {action ? (
            <>
              <p className="mb-3 text-sm text-foreground/90">{action.summary}</p>
              <ThinkingStream
                key={reasoningKey}
                text={action.reasoning}
                triggerKey={reasoningKey}
                className="rounded-xl border border-white/5 bg-black/20 p-3"
              />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {showPlanCta && !plan && (
                  <Button
                    onClick={setupPlan}
                    disabled={executing}
                    className="gap-1.5 bg-emerald-500 text-[#052e22] hover:bg-emerald-400"
                  >
                    {executing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    Set up {action.action === "offer_plan" ? "Pay-in-3" : "payment link"}
                  </Button>
                )}
                <Button onClick={runAria} disabled={deciding} variant="secondary" size="sm" className="gap-1.5">
                  {deciding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  Re-run Aria
                </Button>
              </div>
            </>
          ) : thinking ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-emerald-300" />
              Aria is reading the debtor history and deciding…
            </div>
          ) : (
            <div className="flex flex-col items-start gap-3 py-4">
              <p className="text-sm text-muted-foreground">
                Aria hasn&apos;t looked at this invoice yet. Let it decide the best recovery move.
              </p>
              <Button
                onClick={runAria}
                className="gap-1.5 bg-emerald-500 text-[#052e22] hover:bg-emerald-400"
              >
                <Sparkles className="h-4 w-4" /> Run Aria
              </Button>
            </div>
          )}
        </div>

        {/* Inbox */}
        <div className="glass rounded-2xl p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="text-sm font-medium">Debtor inbox</div>
            <span className="text-xs text-muted-foreground">simulated email thread</span>
          </div>
          <DebtorInbox messages={messages} thinking={thinking} onSend={sendReply} />
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-5">
        <PlanPanel
          invoice={invoice}
          plan={plan}
          paid={paid}
          onCollect={() =>
            plan && router.push(`/pay/${plan.payment_link_id}`)
          }
          onSimulate={simulatePayment}
        />
        <ProfileCard invoice={invoice} />
        <ActionsCard actions={actions} />
      </div>
    </div>
  );
}

function PlanPanel({
  invoice,
  plan,
  paid,
  onCollect,
  onSimulate,
}: {
  invoice: Invoice;
  plan: PlanState | null;
  paid: boolean;
  onCollect: () => void;
  onSimulate: () => void;
}) {
  const total = plan?.total_cents ?? invoice.amount_cents;
  const i1 = plan?.instalment1_cents ?? Math.ceil(total * 0.34);
  const i2 = Math.ceil(total * 0.33);
  const i3 = total - i1 - i2;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <CreditCard className="h-4 w-4 text-emerald-300" /> Pay-in-3 plan
      </div>
      <div className="space-y-2">
        {[
          { label: "Instalment 1 · today", amount: i1, live: true },
          { label: "Instalment 2 · +14 days", amount: i2, live: false },
          { label: "Instalment 3 · +28 days", amount: i3, live: false },
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  row.live ? "bg-emerald-400" : "bg-white/30",
                )}
              />
              <span className="text-xs text-muted-foreground">{row.label}</span>
            </div>
            <span className="text-sm font-medium tabular">{formatMoney(row.amount)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
        <span className="text-xs text-muted-foreground">Total</span>
        <span className="text-base font-semibold tabular">{formatMoney(total)}</span>
      </div>

      <div className="mt-4 space-y-2">
        {!paid && plan && (
          <Button onClick={onCollect} className="w-full gap-1.5 bg-emerald-500 text-[#052e22] hover:bg-emerald-400">
            <ShieldCheck className="h-4 w-4" /> Collect instalment 1 · {formatMoney(i1)}
          </Button>
        )}
        {!paid && !plan && (
          <div className="rounded-lg border border-dashed border-white/10 px-3 py-2 text-center text-xs text-muted-foreground">
            Run Aria, then set up the plan to collect.
          </div>
        )}
        {paid ? (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300">
            <BadgeCheck className="h-4 w-4" /> Fully collected
          </div>
        ) : (
          <Button onClick={onSimulate} variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
            Simulate instant payment
          </Button>
        )}
      </div>
    </div>
  );
}

function ProfileCard({ invoice }: { invoice: Invoice }) {
  const h = invoice.debtor_history;
  const segment = h.segment ?? "new";
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 text-sm font-medium">Debtor profile</div>
      <dl className="space-y-2 text-xs">
        <Row label="Segment" value={segment.replace("_", " ")} />
        <Row label="Prior invoices paid" value={String(h.prior_invoices_paid ?? 0)} />
        <Row label="Prior late" value={String(h.prior_invoices_late ?? 0)} />
        <Row label="Avg days late" value={String(h.average_days_late ?? 0)} />
        {h.first_time_late !== undefined && (
          <Row label="First-time late" value={h.first_time_late ? "Yes" : "No"} />
        )}
      </dl>
      {h.notes && (
        <p className="mt-3 rounded-lg border border-white/5 bg-white/[0.02] p-2 text-[11px] text-muted-foreground">
          {h.notes}
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium capitalize text-foreground/90">{value}</dd>
    </div>
  );
}

function ActionsCard({ actions }: { actions: ActionRecord[] }) {
  const recent = [...actions].reverse().slice(0, 6);
  return (
    <div className="glass rounded-2xl p-5">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <History className="h-4 w-4 text-muted-foreground" /> Activity
      </div>
      {recent.length === 0 ? (
        <p className="text-xs text-muted-foreground">No actions yet.</p>
      ) : (
        <ol className="space-y-3">
          {recent.map((a) => (
            <li key={a.id} className="flex gap-3">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400/70" />
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-foreground/90">{a.type}</div>
                <div className="text-[11px] text-muted-foreground">
                  {new Date(a.created_at).toLocaleString("en-AU")}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
