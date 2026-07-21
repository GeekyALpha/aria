import "server-only";
import { getPinchToken, isPinchConfigured } from "./auth";
import {
  PAY_IN_3_PLAN_NAME,
  type PinchCreatePaymentLinkInput,
  type PinchCreatePayerInput,
  type PinchCreatePlanInput,
  type PinchCreateSubscriptionInput,
  type PinchFeeCalcInput,
  type PinchFeeCalcResult,
  type PinchPaymentLink,
  type PinchPayer,
  type PinchPlan,
  type PinchRealtimeInput,
  type PinchRealtimePayment,
  type PinchSource,
  type PinchSubscription,
} from "./types";

export class PinchError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
  ) {
    super(message);
    this.name = "PinchError";
  }
}

const BASE =
  (process.env.PINCH_API_BASE ?? "https://api.getpinch.com.au/test/").replace(/\/$/, "");
const VERSION = "v2020.1";

async function req<T>(
  path: string,
  opts: { method?: string; body?: unknown; headers?: Record<string, string> } = {},
): Promise<T> {
  const token = await getPinchToken();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "pinch-version": VERSION,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(opts.headers ?? {}),
  };
  const actAs = process.env.PINCH_ACT_AS_MERCHANT_ID;
  if (actAs) headers["Current-Merchant"] = actAs;

  const res = await fetch(`${BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  const text = await res.text();
  const data = text ? safeParse(text) : null;
  if (!res.ok) {
    throw new PinchError(`Pinch ${opts.method ?? "GET"} ${path} → ${res.status}`, res.status, data);
  }
  return data as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// ── Payers ─────────────────────────────────────────────────
export function createPayer(input: PinchCreatePayerInput): Promise<PinchPayer> {
  return req<PinchPayer>("/payers", { method: "POST", body: input });
}

export function addBankSource(
  payerId: string,
  bank: { bankAccountName: string; bankAccountBsb: string; bankAccountNumber: string },
): Promise<PinchSource> {
  return req<PinchSource>(`/payers/${payerId}/sources`, {
    method: "POST",
    body: {
      sourceType: "bank-account",
      bankAccountName: bank.bankAccountName,
      bankAccountBsb: bank.bankAccountBsb,
      bankAccountNumber: bank.bankAccountNumber,
    },
  });
}

// ── Plans & Subscriptions (Pay-in-3) ───────────────────────
export function createPlan(input: PinchCreatePlanInput): Promise<PinchPlan> {
  return req<PinchPlan>("/plans", { method: "POST", body: input });
}

export async function listPlans(): Promise<PinchPlan[]> {
  const data = await req<PinchPlan[]>("/plans");
  return Array.isArray(data) ? data : [];
}

export function createSubscription(input: PinchCreateSubscriptionInput): Promise<PinchSubscription> {
  return req<PinchSubscription>("/subscriptions", { method: "POST", body: input });
}

/**
 * Ensure a reusable percentage "Pay-in-3" plan exists (34/33/33 @ day 0/14/28).
 * requiresTotalAmount=true — each subscription supplies the invoice total.
 */
export async function ensurePayInThreePlan(): Promise<PinchPlan> {
  const configured = process.env.PINCH_PLAN_ID;
  if (configured) {
    try {
      return await req<PinchPlan>(`/plans/${configured}`);
    } catch {
      /* fall through and create */
    }
  }

  const existing = (await listPlans()).find((p) => p.name === PAY_IN_3_PLAN_NAME);
  if (existing) return existing;

  return createPlan({
    name: PAY_IN_3_PLAN_NAME,
    fixedPayments: [
      {
        amountPercentage: 0.34,
        description: "Instalment 1 — today",
        scheduledDateOffset: 0,
        scheduledDateInterval: "days",
        cancelPlanOnFailure: false,
      },
      {
        amountPercentage: 0.33,
        description: "Instalment 2 — in 14 days",
        scheduledDateOffset: 14,
        scheduledDateInterval: "days",
        cancelPlanOnFailure: false,
      },
      {
        amountPercentage: 0.33,
        description: "Instalment 3 — in 28 days",
        scheduledDateOffset: 28,
        scheduledDateInterval: "days",
        cancelPlanOnFailure: false,
      },
    ],
    metadata: JSON.stringify({ product: "aria", plan: "pay-in-3" }),
  });
}

// ── Payment Links ──────────────────────────────────────────
export function createPaymentLink(input: PinchCreatePaymentLinkInput): Promise<PinchPaymentLink> {
  return req<PinchPaymentLink>("/payment-links", { method: "POST", body: input });
}

// ── Realtime card payments ─────────────────────────────────
export function realtimePayment(input: PinchRealtimeInput): Promise<PinchRealtimePayment> {
  return req<PinchRealtimePayment>("/payments/realtime", { method: "POST", body: input });
}

// ── Fees oracle ────────────────────────────────────────────
export function calculateFees(input: PinchFeeCalcInput): Promise<PinchFeeCalcResult> {
  return req<PinchFeeCalcResult>("/fees/calculate", { method: "POST", body: input });
}

// ── Health/config ──────────────────────────────────────────
export { isPinchConfigured };

/** Split a debtor/business name into first + last for Pinch's required firstName. */
export function splitName(full: string): { firstName: string; lastName: string } {
  const trimmed = full.trim() || "Valued Client";
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}
