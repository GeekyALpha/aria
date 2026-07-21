import { z } from "zod";

// NOTE: OpenAI strict structured outputs requires every field be required.
// Use `.nullable()` (not `.optional()`) for fields that may be absent.

export const planTermsSchema = z.object({
  instalments: z.number().int().min(1).max(6),
  schedule: z
    .array(
      z.object({
        percent: z.number().min(0).max(1),
        days_out: z.number().int().min(0),
      }),
    )
    .nullable()
    .describe("Fractions of the total, summing to 1.0."),
});

export const agentActionSchema = z.object({
  reasoning: z
    .string()
    .describe("The step-by-step thought process an observer watches in the live reasoning stream."),
  summary: z.string().describe("A single confident sentence stating the decision."),
  action: z.enum([
    "send_message",
    "offer_plan",
    "send_payment_link",
    "wait",
    "escalate",
    "mark_disputed",
  ]),
  tone: z.enum(["warm", "firm", "urgent", "final_notice"]),
  channel: z.enum(["email", "sms", "whatsapp"]),
  message_subject: z.string().nullable(),
  message_body: z.string().describe("The fully drafted message to the debtor, ready to send."),
  plan_terms: planTermsSchema.nullable(),
  confidence: z.number().min(0).max(1),
  next_step: z.string().describe("What Aria does next if the debtor doesn't respond."),
  escalation_note: z.string().nullable(),
});

export type AgentAction = z.infer<typeof agentActionSchema>;

export function fallbackAction(amountCents: number, debtorName: string): AgentAction {
  return {
    reasoning:
      "Decision engine offline guardrail engaged. Defaulting to the safe path for an overdue balance: " +
      "firm-but-friendly tone, offer a Pay-in-3 instalment plan to maximise recovery while protecting the relationship.",
    summary: `Offer a Pay-in-3 plan to ${debtorName}.`,
    action: "offer_plan",
    tone: "firm",
    channel: "email",
    message_subject: `Let's get your invoice sorted — flexible options inside`,
    message_body:
      `Hi ${debtorName},\n\n` +
      `I'm looking after your outstanding invoice and wanted to reach out personally. ` +
      `If paying the full balance today is tricky, I can split it into 3 manageable instalments ` +
      `(today, +14 days, +28 days) — no paperwork, takes a minute.\n\n` +
      `Just reply here or tap the payment link and we'll get you sorted.\n\n` +
      `Thanks,\nAria · AR Assistant`,
    plan_terms: {
      instalments: 3,
      schedule: [
        { percent: 0.34, days_out: 0 },
        { percent: 0.33, days_out: 14 },
        { percent: 0.33, days_out: 28 },
      ],
    },
    confidence: 0.6,
    next_step: "If no reply in 3 days, escalate tone to urgent and send a direct payment link.",
    escalation_note: null,
  };
}
