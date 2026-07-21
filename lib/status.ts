import type { InvoiceStatus } from "./types";

export interface StatusMeta {
  label: string;
  dot: string;
  text: string;
  bg: string;
  border: string;
  glow: string;
}

const MAP: Record<InvoiceStatus, StatusMeta> = {
  overdue: {
    label: "Overdue",
    dot: "bg-[var(--danger)]",
    text: "text-[var(--danger)]",
    bg: "bg-[rgba(255,82,99,0.10)]",
    border: "border-[rgba(255,82,99,0.25)]",
    glow: "glow-coral",
  },
  negotiating: {
    label: "Negotiating",
    dot: "bg-[var(--warning)]",
    text: "text-[var(--warning)]",
    bg: "bg-[rgba(251,191,36,0.10)]",
    border: "border-[rgba(251,191,36,0.25)]",
    glow: "",
  },
  in_plan: {
    label: "In plan",
    dot: "bg-[var(--info)]",
    text: "text-[var(--info)]",
    bg: "bg-[rgba(96,165,250,0.10)]",
    border: "border-[rgba(96,165,250,0.25)]",
    glow: "",
  },
  paid: {
    label: "Paid",
    dot: "bg-[var(--success)]",
    text: "text-[var(--success)]",
    bg: "bg-[rgba(52,211,153,0.10)]",
    border: "border-[rgba(52,211,153,0.25)]",
    glow: "glow-emerald",
  },
  disputed: {
    label: "Disputed",
    dot: "bg-[var(--warning)]",
    text: "text-[var(--warning)]",
    bg: "bg-[rgba(251,191,36,0.10)]",
    border: "border-[rgba(251,191,36,0.25)]",
    glow: "",
  },
  uncollectable: {
    label: "Uncollectable",
    dot: "bg-muted-foreground",
    text: "text-muted-foreground",
    bg: "bg-white/5",
    border: "border-white/10",
    glow: "",
  },
};

export function statusMeta(status: InvoiceStatus | string): StatusMeta {
  return MAP[(status as InvoiceStatus) ?? "overdue"] ?? MAP.overdue;
}
